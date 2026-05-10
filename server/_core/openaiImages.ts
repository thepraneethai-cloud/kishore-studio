// ============================================================
// OpenAI Image Generation — DALL-E 3 and GPT-image-1
// Synchronous API (no polling needed).
// Generates in small parallel batches to stay within rate limits.
// ============================================================

const OPENAI_API_URL = "https://api.openai.com/v1/images/generations";

// DALL-E 3: best landscape size for YouTube 16:9
const DALLE3_SIZE = "1792x1024";
// GPT-image-1: closest 16:9 available
const GPT_IMAGE_SIZE = "1536x1024";

export type OpenAIImageModel = "dall-e-3" | "gpt-image-1";
export type DalleQuality = "standard" | "hd";
export type DalleStyle = "natural" | "vivid";

export interface OpenAIImageOptions {
  model?: OpenAIImageModel;
  quality?: DalleQuality;
  style?: DalleStyle;
}

export interface OpenAIImageJob {
  id: string;
  status: "succeeded" | "failed";
  output: string[];
  error?: string;
  createdAt: string;
}

async function generateOne(
  prompt: string,
  apiKey: string,
  options: OpenAIImageOptions
): Promise<OpenAIImageJob> {
  const model = options.model ?? "dall-e-3";
  const id = `openai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  try {
    const body: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      size: model === "gpt-image-1" ? GPT_IMAGE_SIZE : DALLE3_SIZE,
    };

    // DALL-E 3 supports quality and style; gpt-image-1 has different quality values
    if (model === "dall-e-3") {
      body.quality = options.quality ?? "standard";
      body.style = options.style ?? "natural";
      body.response_format = "url";
    } else {
      // gpt-image-1 quality: "low" | "medium" | "high"
      body.quality = options.quality === "hd" ? "high" : "medium";
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      data: Array<{ url?: string; b64_json?: string }>;
    };

    const imageUrl = data.data[0]?.url ?? data.data[0]?.b64_json ?? "";
    if (!imageUrl) throw new Error("OpenAI returned no image URL");

    return { id, status: "succeeded", output: [imageUrl], createdAt };
  } catch (err) {
    return {
      id,
      status: "failed",
      output: [],
      error: err instanceof Error ? err.message : String(err),
      createdAt,
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateImagesWithOpenAI(
  prompts: string[],
  apiKey: string,
  options: OpenAIImageOptions = {}
): Promise<OpenAIImageJob[]> {
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const BATCH_SIZE = 3;       // parallel requests per batch (safe for tier-1 rate limits)
  const BATCH_PAUSE_MS = 1200; // pause between batches to avoid 429s

  const results: OpenAIImageJob[] = [];

  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((p) => generateOne(p, apiKey, options))
    );
    results.push(...batchResults);

    // Pause between batches (skip pause after last batch)
    if (i + BATCH_SIZE < prompts.length) {
      await sleep(BATCH_PAUSE_MS);
    }
  }

  return results;
}
