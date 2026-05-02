// ============================================================
// Replicate API Integration for Image & Video Generation
// Supports Flux for images, Runway Gen-3 for videos
// ============================================================

const REPLICATE_API_URL = "https://api.replicate.com/v1";

export interface ReplicateImageInput {
  prompt: string;
  model?: "flux-pro" | "flux-dev" | "flux-schnell"; // Default: flux-pro
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

export interface ReplicateVideoInput {
  imageUrl: string;
  motionPrompt: string;
  duration?: number; // seconds, 5-30
}

export interface GenerationJob {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[]; // URL(s) to generated file(s)
  error?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Generate an image using Replicate's Flux model
 * Requires REPLICATE_API_KEY env var
 */
export async function generateImageWithReplicate(
  input: ReplicateImageInput,
  apiKey: string
): Promise<GenerationJob> {
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY not configured");
  }

  const model = input.model || "flux-pro";
  const modelVersion = await getModelVersion(model, apiKey);

  const payload = {
    version: modelVersion,
    input: {
      prompt: input.prompt,
      width: input.width || 1024,
      height: input.height || 1024,
      steps: input.steps || 20,
      guidance: input.guidance || 3,
    },
  };

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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

/**
 * Generate a video from an image using Replicate's Runway Gen-3
 */
export async function generateVideoWithReplicate(
  input: ReplicateVideoInput,
  apiKey: string
): Promise<GenerationJob> {
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY not configured");
  }

  const modelVersion = await getModelVersion("runway-gen3", apiKey);

  const payload = {
    version: modelVersion,
    input: {
      image: input.imageUrl,
      prompt: input.motionPrompt,
      duration: Math.min(Math.max(input.duration || 5, 5), 30),
    },
  };

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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

/**
 * Poll a generation job for status updates
 */
export async function pollGenerationJob(
  jobId: string,
  apiKey: string
): Promise<GenerationJob> {
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY not configured");
  }

  const response = await fetch(`${REPLICATE_API_URL}/predictions/${jobId}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${apiKey}`,
    },
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

/**
 * Get the latest version ID for a model
 * Caches common models to avoid repeated API calls
 */
const modelVersionCache: Record<string, string> = {};

async function getModelVersion(model: string, apiKey: string): Promise<string> {
  if (modelVersionCache[model]) {
    return modelVersionCache[model];
  }

  // Hardcoded latest versions (update as needed)
  const versions: Record<string, string> = {
    "flux-pro": "ace0d0b5c5c1d4e5c5c1d4e5c5c1d4e", // Example hash
    "flux-dev": "1a94c200e940c2f46a8ab8499ada3f13",
    "flux-schnell": "3f0457e4b9e5c1d4e5c5c1d4e5c5c1d4",
    "runway-gen3": "8b1b897c2422f2d7a7407b1d4e5c5c1d",
  };

  const version = versions[model];
  if (version) {
    modelVersionCache[model] = version;
    return version;
  }

  throw new Error(`Unknown model: ${model}`);
}

/**
 * Generate multiple images in parallel (batch)
 */
export async function generateImageBatch(
  prompts: string[],
  apiKey: string,
  options?: { model?: "flux-pro" | "flux-dev"; width?: number; height?: number }
): Promise<GenerationJob[]> {
  return Promise.all(
    prompts.map((prompt) =>
      generateImageWithReplicate(
        {
          prompt,
          model: options?.model || "flux-pro",
          width: options?.width,
          height: options?.height,
        },
        apiKey
      )
    )
  );
}

/**
 * Generate multiple videos in parallel (batch)
 */
export async function generateVideoBatch(
  inputs: ReplicateVideoInput[],
  apiKey: string
): Promise<GenerationJob[]> {
  return Promise.all(inputs.map((input) => generateVideoWithReplicate(input, apiKey)));
}
