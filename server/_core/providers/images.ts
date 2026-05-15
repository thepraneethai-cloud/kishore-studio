// ============================================================
// DESIGN: Image Generation Providers (Flux, DALL-E, Pollinations, Together AI, fal.ai)
// ============================================================
import { ImageGenerationRequest, ImageGenerationResponse, ProviderConfig } from "../providers";

export async function generateImagesWithFlux(
  request: ImageGenerationRequest,
  config: ProviderConfig
): Promise<ImageGenerationResponse> {
  if (!config.apiKey) {
    throw new Error("Flux API key not configured");
  }

  try {
    const response = await fetch("https://api.bfl.ml/v1/flux-pro-1.0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": config.apiKey,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 25,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Flux API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();

    return {
      urls: data.images.map((img: any) => img.url),
      provider: "flux",
    };
  } catch (error) {
    throw new Error(`Flux generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateImagesWithDALLE(
  request: ImageGenerationRequest,
  config: ProviderConfig
): Promise<ImageGenerationResponse> {
  if (!config.apiKey) {
    throw new Error("DALL-E API key not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "dall-e-3",
        prompt: request.prompt,
        n: request.count || 1,
        size: request.size || "1024x1024",
        quality: "hd",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DALL-E API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();

    return {
      urls: data.data.map((img: any) => img.url),
      provider: "dall-e",
    };
  } catch (error) {
    throw new Error(`DALL-E generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// ── Pollinations.ai ───────────────────────────────────────────
// Completely free — no API key needed. Powered by Flux internally.
// Returns direct image URLs (no polling needed).
export function generateImagesWithPollinations(
  prompts: string[],
  model: "flux" | "flux-realism" | "flux-anime" | "turbo" = "flux"
): string[] {
  return prompts.map((prompt) => {
    const seed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=${model}&seed=${seed}&nologo=true`;
  });
}

// ── Together AI ───────────────────────────────────────────────
// Free tier: FLUX.1-schnell-Free is available at no cost.
// Requires a Together API key (free signup at api.together.ai).
export async function generateImagesWithTogether(
  prompts: string[],
  apiKey: string,
  model = "black-forest-labs/FLUX.1-schnell-Free"
): Promise<string[]> {
  const results = await Promise.all(
    prompts.map(async (prompt) => {
      const response = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, prompt, width: 1024, height: 1024, steps: 4, n: 1, response_format: "url" }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Together AI error: ${(err as any)?.error?.message || response.statusText}`);
      }
      const data = await response.json() as { data: Array<{ url: string }> };
      return data.data[0].url;
    })
  );
  return results;
}

// ── fal.ai images ─────────────────────────────────────────────
// Free credits on signup. Uses FLUX.1-schnell (fast, good quality).
// Synchronous endpoint — returns URLs immediately.
export async function generateImagesWithFal(
  prompts: string[],
  apiKey: string,
  model: "flux-schnell" | "flux-dev" = "flux-schnell"
): Promise<string[]> {
  const endpoint = model === "flux-dev"
    ? "https://fal.run/fal-ai/flux/dev"
    : "https://fal.run/fal-ai/flux/schnell";

  const results = await Promise.all(
    prompts.map(async (prompt) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          image_size: "square_hd",
          num_inference_steps: model === "flux-dev" ? 28 : 4,
          num_images: 1,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`fal.ai error: ${(err as any)?.detail || response.statusText}`);
      }
      const data = await response.json() as { images: Array<{ url: string }> };
      return data.images[0].url;
    })
  );
  return results;
}
