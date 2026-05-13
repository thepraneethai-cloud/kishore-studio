// ============================================================
// DESIGN: Provider Abstraction Layer for Multi-AI Integration
// ============================================================

export type LyricsProvider = "gemini" | "chatgpt" | "claude";
export type ImageProvider = "flux" | "dall-e" | "midjourney";
export type VideoProvider = "runway" | "grok" | "pika";

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface LyricsGenerationRequest {
  subject: string;
  category: string;
  mood: string;
  duration: string;
  languageStyle: string;
  customDirection?: string;
}

export interface LyricsGenerationResponse {
  lyrics: string;
  language: string;
  wordCount: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  size?: string;
  count?: number;
}

export interface ImageGenerationResponse {
  urls: string[];
  provider: ImageProvider;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  style?: string;
}

export interface VideoGenerationResponse {
  url: string;
  provider: VideoProvider;
  duration: number;
}

// Provider Registry
export const LYRICS_PROVIDERS: Record<LyricsProvider, string> = {
  gemini: "Google Gemini",
  chatgpt: "OpenAI ChatGPT",
  claude: "Anthropic Claude",
};

export const IMAGE_PROVIDERS: Record<ImageProvider, string> = {
  flux: "Black Forest Labs Flux",
  "dall-e": "OpenAI DALL-E",
  midjourney: "Midjourney",
};

export const VIDEO_PROVIDERS: Record<VideoProvider, string> = {
  runway: "Runway ML",
  grok: "xAI Grok",
  pika: "Pika Labs",
};

// Helper to get provider display name
export function getProviderName(provider: LyricsProvider | ImageProvider | VideoProvider): string {
  return (
    LYRICS_PROVIDERS[provider as LyricsProvider] ||
    IMAGE_PROVIDERS[provider as ImageProvider] ||
    VIDEO_PROVIDERS[provider as VideoProvider] ||
    provider
  );
}

// Helper to validate provider API key exists
export function validateProviderConfig(provider: string, config?: ProviderConfig): boolean {
  return !!(config?.apiKey && config.apiKey.trim().length > 0);
}
