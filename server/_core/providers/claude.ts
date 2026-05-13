// ============================================================
// DESIGN: Claude Provider Implementation
// ============================================================
import { LyricsGenerationRequest, LyricsGenerationResponse, ProviderConfig } from "../providers";

export async function generateLyricsWithClaude(
  request: LyricsGenerationRequest,
  config: ProviderConfig
): Promise<LyricsGenerationResponse> {
  if (!config.apiKey) {
    throw new Error("Claude API key not configured");
  }

  const prompt = buildClaudePrompt(request);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const lyrics = data.content[0].text;

    return {
      lyrics,
      language: "telugu",
      wordCount: lyrics.split(/\s+/).length,
    };
  } catch (error) {
    throw new Error(`Claude generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function buildClaudePrompt(request: LyricsGenerationRequest): string {
  return `You are an expert Telugu lyricist specializing in devotional songs. Generate authentic, meaningful lyrics that resonate with the subject and mood provided.

Create Telugu devotional lyrics for:
- Subject: ${request.subject}
- Category: ${request.category}
- Mood: ${request.mood}
- Duration: ${request.duration}
- Language Style: ${request.languageStyle}
${request.customDirection ? `- Special Instructions: ${request.customDirection}` : ""}

Requirements:
1. Write in proper Telugu script
2. Include a Pallavi (chorus) that repeats
3. Include 2-3 Charanams (verses)
4. Keep the tone ${request.mood}
5. Ensure cultural authenticity
6. Total duration should match the requested length

Format the output clearly with [Pallavi], [Charanam 1], [Charanam 2], etc.`;
}
