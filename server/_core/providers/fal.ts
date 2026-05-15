// ============================================================
// fal.ai video generation — Wan2.1 image-to-video
// Free credits on signup at fal.ai.
// Uses the async queue API (submit → poll until done).
// ============================================================

const FAL_QUEUE = "https://queue.fal.run";

// Wan2.1 1.3B is the fastest/cheapest model (~$0.025/video)
const WAN_MODEL = "fal-ai/wan/v2.1/1.3b/image-to-video";
// Kling v1.5 via fal (~$0.03/video)
const KLING_MODEL = "fal-ai/kling-video/v1.5/standard/image-to-video";

export type FalVideoModel = "wan" | "kling";

export interface FalVideoJob {
  requestId: string;
  model: FalVideoModel;
  sceneId: number;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export async function submitFalVideoJob(
  imageUrl: string,
  motionPrompt: string,
  sceneId: number,
  apiKey: string,
  model: FalVideoModel = "wan"
): Promise<FalVideoJob> {
  const modelId = model === "kling" ? KLING_MODEL : WAN_MODEL;

  const body = model === "kling"
    ? { prompt: motionPrompt, image_url: imageUrl, duration: "5" }
    : { prompt: motionPrompt, image_url: imageUrl, duration: "5", negative_prompt: "blurry, low quality, camera shake" };

  const response = await fetch(`${FAL_QUEUE}/${modelId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`fal.ai submit error: ${(err as any)?.detail || response.statusText}`);
  }

  const data = await response.json() as { request_id: string };
  return { requestId: data.request_id, model, sceneId, status: "queued" };
}

export async function pollFalVideoJob(
  requestId: string,
  model: FalVideoModel,
  sceneId: number,
  apiKey: string
): Promise<FalVideoJob> {
  const modelId = model === "kling" ? KLING_MODEL : WAN_MODEL;

  const response = await fetch(
    `${FAL_QUEUE}/${modelId}/requests/${requestId}`,
    { headers: { Authorization: `Key ${apiKey}` } }
  );

  if (!response.ok) {
    throw new Error(`fal.ai poll error: ${response.statusText}`);
  }

  const data = await response.json() as {
    status?: string;
    output?: { video?: { url: string } };
    error?: string;
  };

  if (data.status === "COMPLETED" || data.output?.video?.url) {
    return { requestId, model, sceneId, status: "completed", videoUrl: data.output?.video?.url };
  }
  if (data.status === "FAILED" || data.error) {
    return { requestId, model, sceneId, status: "failed", error: data.error || "Generation failed" };
  }
  const status: FalVideoJob["status"] = data.status === "IN_PROGRESS" ? "processing" : "queued";
  return { requestId, model, sceneId, status };
}
