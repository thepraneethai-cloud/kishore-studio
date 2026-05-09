// ============================================================
// Replicate API Integration for Image & Video Generation
// Images: Flux Pro/Dev/Schnell (black-forest-labs)
// Videos: MiniMax Video-01-Live (img + prompt → video)
// Uses the model-owner/name endpoint — no version hashes needed.
// ============================================================

const REPLICATE_API_URL = "https://api.replicate.com/v1";

export interface ReplicateImageInput {
  prompt: string;
  model?: "flux-pro" | "flux-dev" | "flux-schnell";
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
}

export interface ReplicateVideoInput {
  imageUrl: string;
  motionPrompt: string;
  duration?: number;
}

export interface GenerationJob {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const IMAGE_MODELS: Record<string, { owner: string; name: string }> = {
  "flux-pro":     { owner: "black-forest-labs", name: "flux-pro" },
  "flux-dev":     { owner: "black-forest-labs", name: "flux-dev" },
  "flux-schnell": { owner: "black-forest-labs", name: "flux-schnell" },
};

// img2video: accepts first_frame_image + prompt
const VIDEO_MODEL = { owner: "minimax", name: "video-01-live" };

async function postPrediction(
  owner: string,
  name: string,
  input: Record<string, unknown>,
  apiKey: string
): Promise<GenerationJob> {
  const response = await fetch(
    `${REPLICATE_API_URL}/models/${owner}/${name}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as {
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
    created_at: string;
    completed_at?: string;
  };

  return {
    id: data.id,
    status: (data.status as GenerationJob["status"]) || "starting",
    output: data.output,
    error: data.error,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  };
}

export async function generateImageWithReplicate(
  input: ReplicateImageInput,
  apiKey: string
): Promise<GenerationJob> {
  if (!apiKey) throw new Error("Replicate API key not configured");

  const modelKey = input.model || "flux-pro";
  const model = IMAGE_MODELS[modelKey];
  if (!model) throw new Error(`Unknown image model: ${modelKey}`);

  return postPrediction(model.owner, model.name, {
    prompt: input.prompt,
    width: input.width || 1024,
    height: input.height || 576,  // 16:9 default for YouTube
    ...(modelKey !== "flux-schnell" && {
      num_inference_steps: input.steps || 28,
      guidance_scale: input.guidance || 3.5,
    }),
    ...(input.seed != null && { seed: input.seed }),
  }, apiKey);
}

export async function generateVideoWithReplicate(
  input: ReplicateVideoInput,
  apiKey: string
): Promise<GenerationJob> {
  if (!apiKey) throw new Error("Replicate API key not configured");

  return postPrediction(VIDEO_MODEL.owner, VIDEO_MODEL.name, {
    prompt: input.motionPrompt,
    first_frame_image: input.imageUrl,
  }, apiKey);
}

export async function pollGenerationJob(
  jobId: string,
  apiKey: string
): Promise<GenerationJob> {
  if (!apiKey) throw new Error("Replicate API key not configured");

  const response = await fetch(`${REPLICATE_API_URL}/predictions/${jobId}`, {
    headers: { Authorization: `Token ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to poll job ${jobId}: ${response.status}`);
  }

  const data = (await response.json()) as {
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
    created_at: string;
    completed_at?: string;
  };

  return {
    id: data.id,
    status: (data.status as GenerationJob["status"]) || "processing",
    output: data.output,
    error: data.error,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  };
}

export async function generateImageBatch(
  prompts: string[],
  apiKey: string,
  options?: {
    model?: "flux-pro" | "flux-dev" | "flux-schnell";
    width?: number;
    height?: number;
    seed?: number;
  }
): Promise<GenerationJob[]> {
  return Promise.all(
    prompts.map((prompt) =>
      generateImageWithReplicate(
        {
          prompt,
          model: options?.model || "flux-dev",
          width: options?.width,
          height: options?.height,
          seed: options?.seed,
        },
        apiKey
      )
    )
  );
}

export async function generateVideoBatch(
  inputs: ReplicateVideoInput[],
  apiKey: string
): Promise<GenerationJob[]> {
  return Promise.all(inputs.map((input) => generateVideoWithReplicate(input, apiKey)));
}
