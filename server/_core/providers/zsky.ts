import { isR2Configured, uploadToR2 } from "../r2Storage";

export interface ZSkyVideoJob {
  requestId: string;
  sceneId: number;
  status: "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

interface ZSkyVideoInput {
  imageUrl: string;
  motionPrompt: string;
  sceneId: number;
  duration?: number;
}

function getErrorText(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  return String(record.error || record.message || record.detail || fallback);
}

export async function generateZSkyVideoClip(input: ZSkyVideoInput): Promise<ZSkyVideoJob> {
  if (!isR2Configured()) {
    throw new Error("R2 storage is required for ZSky video output. Set R2_* variables before using ZSky.");
  }

  const response = await fetch("https://zsky.ai/api/v1/video/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: input.imageUrl,
      prompt: input.motionPrompt,
      duration: Math.max(5, Math.min(10, input.duration || 5)),
      resolution: "1080p",
      audio: false,
      style: "cinematic",
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");
    throw new Error(`ZSky API error: ${getErrorText(payload, response.statusText)}`);
  }

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null) as
      | { url?: string; video_url?: string; output?: string | { url?: string } }
      | null;
    const url = data?.video_url || data?.url || (typeof data?.output === "string" ? data.output : data?.output?.url);
    if (!url) throw new Error("ZSky returned JSON without a video URL.");
    return {
      requestId: `zsky-${Date.now()}-${input.sceneId}`,
      sceneId: input.sceneId,
      status: "completed",
      videoUrl: url,
    };
  }

  if (!contentType.startsWith("video/")) {
    const preview = await response.text().catch(() => "");
    throw new Error(`ZSky returned ${contentType || "unknown content"} instead of a video.${preview ? ` ${preview.slice(0, 120)}` : ""}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const url = await uploadToR2(`videos/zsky-${Date.now()}-${input.sceneId}.mp4`, body, contentType || "video/mp4");

  return {
    requestId: `zsky-${Date.now()}-${input.sceneId}`,
    sceneId: input.sceneId,
    status: "completed",
    videoUrl: url,
  };
}
