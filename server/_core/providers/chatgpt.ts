// ============================================================
// DESIGN: ChatGPT Provider Implementation
// ============================================================
import { LyricsGenerationRequest, LyricsGenerationResponse, ProviderConfig } from "../providers";

export async function generateLyricsWithChatGPT(
  request: LyricsGenerationRequest,
  config: ProviderConfig
): Promise<LyricsGenerationResponse> {
  if (!config.apiKey) {
    throw new Error("ChatGPT API key not configured");
  }

  const prompt = buildChatGPTPrompt(request);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert Telugu lyricist specializing in devotional songs. Generate authentic, meaningful lyrics that resonate with the subject and mood provided.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ChatGPT API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const lyrics = data.choices[0].message.content;

    return {
      lyrics,
      language: "telugu",
      wordCount: lyrics.split(/\s+/).length,
    };
  } catch (error) {
    throw new Error(`ChatGPT generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function buildChatGPTPrompt(request: LyricsGenerationRequest): string {
  return `
Create authentic Telugu devotional lyrics for:
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

Format the output clearly with [Pallavi], [Charanam 1], [Charanam 2], etc.
`;
}
