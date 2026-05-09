// ============================================================
// Telugu Devotional Lyrics Generation using LLM
// ============================================================

import { invokeLLM } from "./llm";

export interface LyricsGenerationInput {
  deity: string;
  customPrompt?: string;
  theme?: string;
  duration?: number;
  language?: "telugu" | "english";
  llmApiKey?: string; // User's own Gemini key; falls back to server Forge key when absent
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
  venkateswara: `Venkateswara (Balaji/Srinivasa) is the supreme deity of Tirupati, embodying divine grace and eternal protection.
    Common themes: pilgrimage to Tirumala, Alipiri steps, Govinda chanting, seven hills, Pushkarini lake, divine darshan, blessings.
    Instruments: Veena, Mridangam, Nadaswaram, Flute. Mood: Divine, majestic, devotional surrender.`,

  ganesha: `Ganesha (Vighneshwara/Ganapati) is the remover of obstacles, lord of beginnings and wisdom.
    Common themes: Vinayaka Chavithi, modak, mouse vehicle (Mushika), broken tusk, prosperity, new endeavors, Lambodara.
    Instruments: Tabla, Dholak, Flute, Harmonium. Mood: Joyful, auspicious, celebratory.`,

  lakshmi: `Lakshmi (Mahalakshmi/Dhanalakshmi) is the goddess of wealth, fortune, and divine grace.
    Common themes: Diwali, lotus throne, gold coins, white elephants performing abhishek, red saree, abundance, prosperity.
    Instruments: Veena, Sitar, Flute, Santoor. Mood: Serene, graceful, auspicious.`,

  shiva: `Shiva (Mahadeva/Shankar) is the supreme consciousness, destroyer of ego and ignorance.
    Common themes: Kailash, Nataraja cosmic dance, Shiva lingam, Ganga in matted hair, Nandi, trident, Shivaratri, vibhuti.
    Instruments: Damaru, Rudra Veena, Flute, Mridangam. Mood: Powerful, mystical, transcendent.`,

  krishna: `Krishna (Govinda/Madhava) is the supreme deity of divine love and playful devotion, the charioteer of the Gita.
    Common themes: Brindavana, Radha's love, flute music, butter theft, Vrindavan, Mathura, Gokul, Gita wisdom, Hare Krishna.
    Instruments: Flute (Krishna's signature), Tabla, Mridangam, Harmonium. Mood: Joyful, playful, deeply devotional, longing.`,

  hanuman: `Hanuman (Anjaneya/Maruti) is the supreme devotee of Rama, embodying strength, loyalty, and selfless service.
    Common themes: Rama's eternal servant, crossing the ocean, Lanka, rescuing Sita, divine strength, celibacy, Panchamukha.
    Instruments: Veena, Mridangam, Dholak, Nadaswaram. Mood: Heroic, devotionally surrendered, victorious.`,

  rama: `Rama (Raghava/Ramachandra) is the ideal king and seventh avatar of Vishnu, embodiment of dharma and righteousness.
    Common themes: Ayodhya, Sita, forest exile (Vanavasa), Ramayana, bridge to Lanka, the perfect king, victory of dharma, Dasaratha.
    Instruments: Veena, Nadaswaram, Flute, Mridangam. Mood: Majestic, virtuous, devotionally reverent.`,

  saraswati: `Saraswati (Sharada/Vageeshwari) is the goddess of learning, arts, music, and divine wisdom.
    Common themes: white swan, Veena, books and scrolls, students seeking blessings, Vasant Panchami, Saraswati Puja, divine knowledge.
    Instruments: Veena (her signature), Flute, Bells, Harmonium. Mood: Pure, serene, gracefully transcendent.`,

  durga: `Durga (Shakti/Bhavani/Durgamba) is the fierce mother goddess, destroyer of evil and protector of her devotees.
    Common themes: lion vehicle, ten arms with weapons, victory over Mahishasura, Navratri, divine power, mother's protection.
    Instruments: Dappu, Nadaswaram, Tabla, Bells, Mridangam. Mood: Powerful, fierce, protective, unconditionally maternal.`,

  murugan: `Murugan (Kartikeya/Subramanya/Skanda) is the youthful son of Shiva and Parvati, god of war and divine wisdom.
    Common themes: peacock vehicle, vel (spear), Valli and Devasena, six abodes (Arupadai Veedu), Palani, Tiruchendur, Kavadi.
    Instruments: Nadaswaram, Veena, Mridangam, Flute. Mood: Youthful, radiant, victorious, deeply devotional.`,

  narasimha: `Narasimha (Nrusimha/Ugra Narasimha) is the fierce half-man half-lion fourth avatar of Vishnu who protects unwavering devotees.
    Common themes: Prahlada's devotion, emerging from the pillar, defeat of Hiranyakashipu, Ahobilam (Andhra's sacred shrine), divine protection.
    Instruments: Nadaswaram, Mridangam, Veena, Bells. Mood: Fierce and protective, miraculous, awe-inspiring devotion.`,

  ayyappa: `Ayyappa (Dharmasastha/Sastha) is the celibate forest deity born of Shiva and Mohini, the god of Sabarimala pilgrimage.
    Common themes: 41-day Mandala Deeksha, the 18 sacred steps, forest trek, Makaravilakku star, divine celibacy, Swamiye Saranam Ayyappa.
    Instruments: Flute, Mridangam, Chenda, Bells. Mood: Austere, pilgrim's surrender, deeply devotional.`,

  subramanya: `Subramanya (Kartikeya/Murugan/Skanda) is the divine warrior son of Shiva revered across South India.
    Common themes: vel (divine spear), peacock vehicle, victory over Tarakasura, Skanda Sashti, Valli and Devasena, six faces (Shanmukha).
    Instruments: Nadaswaram, Flute, Mridangam. Mood: Youthful, victorious, radiant devotion.`,
};

// Runtime cache for dynamically-generated deity contexts (avoids re-generating each request)
const deityContextCache = new Map<string, string>();

async function getDeityContext(deity: string, llmApiKey?: string): Promise<string> {
  const key = deity.toLowerCase().trim();

  // Check hardcoded map first (covers all known deities instantly)
  const hardcoded = DEITY_CONTEXT[key];
  if (hardcoded) return hardcoded;

  // Check aliases
  const aliases: Record<string, string> = {
    balaji: "venkateswara", srinivasa: "venkateswara", govinda: "venkateswara",
    ganapati: "ganesha", vinayaka: "ganesha", vighneshwara: "ganesha",
    mahalakshmi: "lakshmi", dhanalakshmi: "lakshmi",
    mahadeva: "shiva", shankar: "shiva", shankaraa: "shiva",
    govind: "krishna", madhava: "krishna", radha: "krishna",
    anjaneya: "hanuman", maruti: "hanuman",
    raghava: "rama", ramachandra: "rama",
    sharada: "saraswati", vageeshwari: "saraswati",
    shakti: "durga", bhavani: "durga", durgamba: "durga",
    kartikeya: "murugan", skanda: "murugan",
    nrusimha: "narasimha", ugra: "narasimha",
    sastha: "ayyappa", dharmasastha: "ayyappa",
  };
  const aliasTarget = aliases[key];
  if (aliasTarget && DEITY_CONTEXT[aliasTarget]) return DEITY_CONTEXT[aliasTarget];

  // Check runtime cache for previously-generated contexts
  if (deityContextCache.has(key)) return deityContextCache.get(key)!;

  // Generate context dynamically via LLM for any other deity
  try {
    const response = await invokeLLM({
      messages: [{
        role: "user",
        content: `In 3-4 sentences, describe "${deity}" as a Hindu deity for writing Telugu devotional songs (bhajans). Include: who they are and their divine role, the most common devotional themes and sacred places associated with them, traditional instruments used in their worship music, and the typical emotional mood of their bhajans. Be specific and concise.`,
      }],
    }, llmApiKey ? { apiKey: llmApiKey } : undefined);

    const content = response.choices[0]?.message.content;
    const context = typeof content === "string" && content.trim()
      ? content.trim()
      : `${deity} is a revered Hindu deity with a rich devotional tradition in Telugu worship.`;

    deityContextCache.set(key, context);
    return context;
  } catch {
    // Never block lyrics generation due to context failure
    return `${deity} is a revered Hindu deity. Create authentic devotional content that honors traditional bhajan conventions for this deity.`;
  }
}

/**
 * Generate Telugu devotional lyrics using Claude/GPT
 * Supports custom prompts for user-directed generation
 */
export async function generateDevotionalLyrics(
  input: LyricsGenerationInput
): Promise<GeneratedLyrics> {
  const duration = input.duration || 4;

  // Fetches hardcoded context instantly, or generates via LLM for unlisted deities
  const deityContext = await getDeityContext(input.deity, input.llmApiKey);

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
    }, input.llmApiKey ? { apiKey: input.llmApiKey } : undefined);

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
function generateSunoStyleForDeity(deity: string, _theme?: string): SunoStyle {
  const key = deity.toLowerCase().trim();

  const sunoStyles: Record<string, SunoStyle> = {
    venkateswara: {
      tempo: "medium",
      style: "Slow devotional bhajan, Nadaswaram-led",
      mood: "Divine & Majestic",
      instruments: ["Veena", "Mridangam", "Nadaswaram", "Flute"],
      vocals: "Male devotional tenor, classical training",
    },
    ganesha: {
      tempo: "energetic",
      style: "Energetic devotional keertana",
      mood: "Joyful & Celebratory",
      instruments: ["Tabla", "Dholak", "Flute", "Harmonium"],
      vocals: "Male baritone bhajan with chorus",
    },
    lakshmi: {
      tempo: "slow",
      style: "Serene devotional bhajan",
      mood: "Graceful & Peaceful",
      instruments: ["Veena", "Sitar", "Flute", "Santoor"],
      vocals: "Female classical soprano",
    },
    shiva: {
      tempo: "classical",
      style: "Carnatic classical keertana with Damaru rhythm",
      mood: "Meditative & Mystical",
      instruments: ["Damaru", "Veena", "Mridangam", "Flute"],
      vocals: "Male Carnatic classical tenor",
    },
    krishna: {
      tempo: "medium",
      style: "Playful devotional bhajan, flute-led",
      mood: "Joyful & Longing",
      instruments: ["Flute", "Tabla", "Harmonium", "Mridangam"],
      vocals: "Soft male devotional voice, melodic",
    },
    hanuman: {
      tempo: "medium",
      style: "Heroic devotional bhajan",
      mood: "Heroic & Devotional",
      instruments: ["Mridangam", "Dholak", "Nadaswaram", "Veena"],
      vocals: "Powerful male devotional baritone",
    },
    rama: {
      tempo: "medium",
      style: "Majestic devotional keertana",
      mood: "Majestic & Virtuous",
      instruments: ["Veena", "Nadaswaram", "Flute", "Mridangam"],
      vocals: "Male devotional tenor, dignified",
    },
    saraswati: {
      tempo: "slow",
      style: "Pure Carnatic devotional, Veena-led",
      mood: "Serene & Graceful",
      instruments: ["Veena", "Flute", "Bells", "Violin"],
      vocals: "Female classical vocalist, gentle",
    },
    durga: {
      tempo: "energetic",
      style: "Powerful Shakti bhajan with drumbeats",
      mood: "Powerful & Fierce",
      instruments: ["Dappu", "Nadaswaram", "Tabla", "Bells"],
      vocals: "Powerful female or male devotional voice",
    },
    murugan: {
      tempo: "medium",
      style: "South Indian devotional, Nadaswaram-led",
      mood: "Radiant & Devotional",
      instruments: ["Nadaswaram", "Mridangam", "Veena", "Flute"],
      vocals: "Male devotional tenor, youthful",
    },
    narasimha: {
      tempo: "medium",
      style: "Powerful Vaishnava keertana",
      mood: "Fierce & Devotional",
      instruments: ["Nadaswaram", "Mridangam", "Veena", "Bells"],
      vocals: "Powerful male devotional baritone",
    },
    ayyappa: {
      tempo: "medium",
      style: "Pilgrim bhajan, forest-sacred atmosphere",
      mood: "Austere & Devotional",
      instruments: ["Flute", "Mridangam", "Chenda", "Bells"],
      vocals: "Male group bhajan with call and response",
    },
    subramanya: {
      tempo: "medium",
      style: "South Indian devotional, Nadaswaram-led",
      mood: "Radiant & Victorious",
      instruments: ["Nadaswaram", "Mridangam", "Flute"],
      vocals: "Male devotional tenor, youthful",
    },
  };

  // Check aliases
  const aliases: Record<string, string> = {
    balaji: "venkateswara", srinivasa: "venkateswara",
    ganapati: "ganesha", vinayaka: "ganesha",
    mahalakshmi: "lakshmi",
    mahadeva: "shiva", shankar: "shiva",
    govinda: "krishna", madhava: "krishna",
    anjaneya: "hanuman", maruti: "hanuman",
    raghava: "rama", ramachandra: "rama",
    sharada: "saraswati",
    shakti: "durga", bhavani: "durga",
    kartikeya: "murugan", skanda: "murugan",
    nrusimha: "narasimha",
    sastha: "ayyappa",
  };

  return sunoStyles[key] || sunoStyles[aliases[key]] || {
    tempo: "medium",
    style: "Devotional bhajan",
    mood: "Meditative & Peaceful",
    instruments: ["Harmonium", "Tabla", "Flute", "Mridangam"],
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
