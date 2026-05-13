// ============================================================
// DESIGN: Image Generation Providers (Flux, DALL-E)
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
