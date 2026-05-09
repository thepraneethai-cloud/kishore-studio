// ============================================================
// Telugu Devotional Lyrics Generation using LLM
// ============================================================

import { invokeLLM } from "./llm";

export interface LyricsGenerationInput {
  deity: string; // Accept any deity name (Hanuman, Shiva, custom mythology, etc.)
  customPrompt?: string; // User can provide their own direction
  theme?: string; // e.g., "devotion", "gratitude", "protection"
  duration?: number; // Estimated duration in minutes (3-6)
  language?: "telugu" | "english"; // Output language
}

export interface SunoStyle {
  tempo: string;
  style: string;
  mood: string;
  instruments: string[];
  vocals: string;
}

export interface GeneratedLyrics {
  lyrics: string;
  sunoStyle?: SunoStyle;
  structure: {
    pallavi: string;
    charanam1: string;
    charanam2?: string;
    outro?: string;
  };
  metadata: {
    deity: string;
    theme?: string;
    estimatedDuration: number;
    generatedAt: string;
  };
}

const DEITY_CONTEXT: Record<string, string> = {
  venkateswara: `Venkateswara (Balaji) is the supreme deity of Tirupati, embodying divine grace and protection. 
    Common themes: pilgrimage to Tirupati, devotion at Alipiri steps, blessings, divine love, eternal protection.
    Instruments: Veena, Mridangam, Nadaswaram. Mood: Divine, majestic, devotional.`,
  ganesha: `Ganesha is the remover of obstacles, the beginning of all auspicious endeavors.
    Common themes: wisdom, prosperity, overcoming challenges, new beginnings, playfulness.
    Instruments: Tabla, Dholak, Flute. Mood: Joyful, auspicious, energetic.`,
  lakshmi: `Lakshmi is the goddess of wealth, fortune, and abundance.
    Common themes: prosperity, grace, abundance, generosity, divine feminine power.
    Instruments: Veena, Sitar, Flute. Mood: Serene, graceful, auspicious.`,
  shiva: `Shiva is the supreme consciousness, the destroyer of ego and ignorance.
    Common themes: meditation, transcendence, cosmic dance, transformation, mysticism.
    Instruments: Damaru, Veena, Flute. Mood: Powerful, mystical, transcendent.`,
};

/**
 * Generate Telugu devotional lyrics using Claude/GPT
 * Supports custom prompts for user-directed generation
 */
export async function generateDevotionalLyrics(
  input: LyricsGenerationInput
): Promise<GeneratedLyrics> {
  const deityContext = DEITY_CONTEXT[input.deity];
  const duration = input.duration || 4;

  let systemPrompt = `You are an expert Telugu devotional songwriter. Your task is to create authentic, emotionally resonant devotional lyrics (bhajans) that honor the deity and resonate with devotees.

DEITY CONTEXT:
${deityContext}

REQUIREMENTS:
- Write in ${input.language === "english" ? "English (transliterated Telugu names)" : "Telugu script"}
- Structure: Pallavi (chorus, 2-4 lines) + Charanam 1 (verse, 4-6 lines) + Charanam 2 (optional, 4-6 lines) + Outro (optional, 2-3 lines)
- Estimated duration: ${duration} minutes (adjust line count accordingly)
- Each line should be singable (8-12 syllables)
- Include specific references to the deity's attributes, stories, or sacred sites
- Use poetic devices: metaphor, repetition, call-and-response
- Emotional arc: Build from reverence → devotion → surrender → blessing
- Avoid clichés; be specific and vivid
- Include at least one reference to a sacred location or ritual

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "pallavi": "...",
  "charanam1": "...",
  "charanam2": "...",
  "outro": "...",
  "notes": "Brief explanation of the lyrical theme and structure"
}`;

  if (input.customPrompt) {
    systemPrompt += `\n\nUSER DIRECTION:\n${input.customPrompt}\n\nIncorporate this direction while maintaining the devotional authenticity and structure above.`;
  }

  const userMessage = `Create a ${duration}-minute devotional bhajan for ${input.deity.charAt(0).toUpperCase() + input.deity.slice(1)}${input.theme ? ` with the theme of "${input.theme}"` : ""}.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "devotional_lyrics",
          strict: true,
          schema: {
            type: "object",
            properties: {
              pallavi: {
                type: "string",
                description: "Chorus section (2-4 lines)",
              },
              charanam1: {
                type: "string",
                description: "First verse (4-6 lines)",
              },
              charanam2: {
                type: "string",
                description: "Second verse (4-6 lines, optional)",
              },
              outro: {
                type: "string",
                description: "Closing section (2-3 lines, optional)",
              },
              notes: {
                type: "string",
                description: "Brief explanation of the lyrical theme",
              },
            },
            required: ["pallavi", "charanam1", "notes"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    // Strip markdown code fences — some models wrap JSON in ```json ... ``` despite json_schema format
    const jsonStr = contentStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { pallavi: string; charanam1: string; charanam2?: string; outro?: string; notes: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[LyricsGeneration] Invalid JSON from LLM:", contentStr);
      throw new Error("LLM returned malformed JSON — please try generating again.");
    }

    // Combine all sections into a single lyrics string
    const lyrics = [
      `[Pallavi]\n${parsed.pallavi}`,
      `\n[Charanam 1]\n${parsed.charanam1}`,
      parsed.charanam2 ? `\n[Charanam 2]\n${parsed.charanam2}` : "",
      parsed.outro ? `\n[Outro]\n${parsed.outro}` : "",
    ]
      .filter(Boolean)
      .join("");

    // Generate SUNO style based on deity and theme
    const sunoStyle = generateSunoStyleForDeity(input.deity, input.theme);

    return {
      lyrics,
      sunoStyle,
      structure: {
        pallavi: parsed.pallavi,
        charanam1: parsed.charanam1,
        charanam2: parsed.charanam2 || "",
        outro: parsed.outro || "",
      },
      metadata: {
        deity: input.deity,
        theme: input.theme,
        estimatedDuration: duration,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[LyricsGeneration] Error:", error);
    throw new Error(`Failed to generate lyrics: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate SUNO style based on deity and theme
 */
function generateSunoStyleForDeity(deity: string, theme?: string): SunoStyle {
  const deityLower = deity.toLowerCase();
  
  const sunoStyles: Record<string, SunoStyle> = {
    venkateswara: {
      tempo: "medium",
      style: "Slow devotional bhajan",
      mood: "Divine & Majestic",
      instruments: ["Veena", "Mridangam", "Nadaswaram"],
      vocals: "Male devotional tenor",
    },
    ganesha: {
      tempo: "energetic",
      style: "Energetic devotional keertana",
      mood: "Joyful & Celebratory",
      instruments: ["Tabla", "Dholak", "Flute"],
      vocals: "Male baritone bhajan",
    },
    lakshmi: {
      tempo: "slow",
      style: "Serene devotional bhajan",
      mood: "Graceful & Peaceful",
      instruments: ["Veena", "Sitar", "Flute"],
      vocals: "Female classical soprano",
    },
    shiva: {
      tempo: "classical",
      style: "Carnatic classical keertana",
      mood: "Meditative & Mystical",
      instruments: ["Veena", "Mridangam", "Violin"],
      vocals: "Male carnatic classical",
    },
  };

  return sunoStyles[deityLower] || {
    tempo: "medium",
    style: "Devotional bhajan",
    mood: "Meditative & Peaceful",
    instruments: ["Harmonium", "Tabla", "Flute"],
    vocals: "Male devotional tenor",
  };
}

/**
 * Regenerate lyrics with a different theme or custom direction
 */
export async function regenerateLyrics(
  input: LyricsGenerationInput
): Promise<GeneratedLyrics> {
  return generateDevotionalLyrics(input);
}
