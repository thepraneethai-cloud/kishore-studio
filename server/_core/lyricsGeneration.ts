// ============================================================
// Telugu Song Lyrics Generation using LLM
// ============================================================

import { invokeLLM } from "./llm";

export type SongCategory = "devotional" | "cinematic" | "folk" | "romantic" | "emotional" | "festival" | "mass";
export type LanguageStyle = "pure_telugu" | "colloquial" | "poetic" | "mixed";
export type OutputType    = "lyrics_only" | "lyrics_suno" | "lyrics_scene";

export interface LyricsGenerationInput {
  deity: string;             // subject/topic (deity name for devotional, subject for others)
  category?: SongCategory;
  mood?: string;
  languageStyle?: LanguageStyle;
  outputType?: OutputType;
  customPrompt?: string;     // appended to system prompt (iterate feedback, manual direction)
  directivePrompt?: string;  // replaces the user message entirely (AI-generated vision brief)
  theme?: string;
  duration?: number;
  language?: "telugu" | "english";
  llmApiKey?: string;
  llmModel?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  groqApiKey?: string;
  mistralApiKey?: string;
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
  sceneNotes?: string;
  structure: {
    pallavi: string;
    charanam1: string;
    charanam2?: string;
    charanam3?: string;
    charanam4?: string;
    outro?: string;
  };
  metadata: {
    deity: string;
    theme?: string;
    category?: string;
    estimatedDuration: number;
    generatedAt: string;
  };
}

// ── Category-aware SUNO presets ──────────────────────────────
const SUNO_PRESETS: Record<SongCategory, SunoStyle> = {
  devotional: {
    tempo: "slow-medium",
    style: "Telugu devotional bhajan, Carnatic classical",
    mood: "Meditative, spiritual, peaceful",
    instruments: ["Harmonium", "Tabla", "Flute", "Mridangam", "Veena"],
    vocals: "Male devotional tenor, traditional",
  },
  cinematic: {
    tempo: "variable",
    style: "Telugu cinematic score, orchestral",
    mood: "Epic, cinematic, dramatic",
    instruments: ["Orchestral strings", "Brass", "Piano", "Drums", "Synth"],
    vocals: "Playback singer, cinematic style",
  },
  folk: {
    tempo: "medium-upbeat",
    style: "Telugu folk (Janapada), village folk",
    mood: "Earthy, festive, rustic, raw",
    instruments: ["Dappu", "Flute", "Dotara", "Harmonium", "Nadaswaram"],
    vocals: "Folk vocal style, group chorus",
  },
  romantic: {
    tempo: "slow-medium",
    style: "Telugu melody, romantic pop",
    mood: "Romantic, dreamy, gentle, longing",
    instruments: ["Guitar", "Piano", "Violin", "Light percussion", "Synth pads"],
    vocals: "Soft male or female playback vocals",
  },
  emotional: {
    tempo: "slow",
    style: "Telugu emotional ballad",
    mood: "Melancholic, heartfelt, raw emotion",
    instruments: ["Piano", "Violin", "Cello", "Ambient pads"],
    vocals: "Emotional playback vocalist, expressive",
  },
  festival: {
    tempo: "fast",
    style: "Telugu festival celebration song",
    mood: "Joyful, energetic, celebratory",
    instruments: ["Dhol", "Brass", "Synth", "Dappu", "Percussion"],
    vocals: "Energetic male vocals, group chorus",
  },
  mass: {
    tempo: "fast",
    style: "Telugu mass anthem, commercial mass",
    mood: "Power, swagger, raw aggression, mass appeal",
    instruments: ["Heavy bass", "Drums", "Brass", "Rock guitar", "Synth"],
    vocals: "Powerful male vocals, punch delivery",
  },
};

// ── Devotional deity context (keeps all existing data) ───────
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

const deityContextCache = new Map<string, string>();

function buildLLMOptions(
  llmApiKey?: string,
  llmModel?: string,
  openaiApiKey?: string,
  claudeApiKey?: string,
  groqApiKey?: string,
  mistralApiKey?: string,
) {
  return {
    ...(llmApiKey    ? { apiKey: llmApiKey } : {}),
    ...(llmModel     ? { model: llmModel }   : {}),
    ...(openaiApiKey ? { openaiApiKey }      : {}),
    ...(claudeApiKey ? { claudeApiKey }      : {}),
    ...(groqApiKey   ? { groqApiKey }        : {}),
    ...(mistralApiKey ? { mistralApiKey }    : {}),
  };
}

// ── Subject/deity context ────────────────────────────────────
async function getSubjectContext(
  subject: string,
  category: SongCategory,
  llmApiKey?: string,
  llmModel?: string,
  openaiApiKey?: string,
  claudeApiKey?: string,
  groqApiKey?: string,
  mistralApiKey?: string,
): Promise<string> {
  // For devotional, use the existing deity context map
  if (category === "devotional") {
    const key = subject.toLowerCase().trim();
    const hardcoded = DEITY_CONTEXT[key];
    if (hardcoded) return hardcoded;

    const aliases: Record<string, string> = {
      // Venkateswara
      balaji: "venkateswara", srinivasa: "venkateswara", govinda: "venkateswara",
      tirupati: "venkateswara", "sri venkateswara": "venkateswara", "lord venkateswara": "venkateswara",
      // Ganesha
      ganapati: "ganesha", vinayaka: "ganesha", vighneshwara: "ganesha",
      ganapathi: "ganesha", ganesh: "ganesha", ganpati: "ganesha",
      // Lakshmi
      mahalakshmi: "lakshmi", dhanalakshmi: "lakshmi", "sri lakshmi": "lakshmi",
      // Shiva
      mahadeva: "shiva", shankar: "shiva", shankaraa: "shiva",
      maheshwara: "shiva", bholenath: "shiva", shambho: "shiva",
      // Krishna
      govind: "krishna", madhava: "krishna", radha: "krishna",
      "jai krishna": "krishna", "sri krishna": "krishna",
      // Hanuman
      anjaneya: "hanuman", maruti: "hanuman", bajrangbali: "hanuman",
      "jai hanuman": "hanuman", "sri hanuman": "hanuman",
      // Rama — cover all common salutation forms
      raghava: "rama", ramachandra: "rama", raghavendra: "rama",
      "sri rama": "rama", "sri ram": "rama", "jai sriram": "rama",
      "jai sri ram": "rama", "jai ram": "rama", "jai shri ram": "rama",
      "lord rama": "rama", "lord ram": "rama",
      // Saraswati
      sharada: "saraswati", vageeshwari: "saraswati", "sri saraswati": "saraswati",
      // Durga
      shakti: "durga", bhavani: "durga", durgamba: "durga",
      "jai durga": "durga", "sri durga": "durga",
      // Murugan
      kartikeya: "murugan", skanda: "murugan", subrahmanya: "murugan",
      // Narasimha
      nrusimha: "narasimha", ugra: "narasimha", "sri narasimha": "narasimha",
      // Ayyappa
      sastha: "ayyappa", dharmasastha: "ayyappa", "swami ayyappa": "ayyappa",
    };
    // Also handle "jai sriram", "sri rama" etc. with multi-word fuzzy match
    const aliasTarget = aliases[key] ?? Object.entries(aliases).find(([k]) => key.includes(k))?.[1];
    if (aliasTarget && DEITY_CONTEXT[aliasTarget]) return DEITY_CONTEXT[aliasTarget];
  }

  const cacheKey = `${category}:${subject.toLowerCase().trim()}`;
  if (deityContextCache.has(cacheKey)) return deityContextCache.get(cacheKey)!;

  // For non-devotional categories, generate a short context via LLM
  const categoryDescriptions: Record<SongCategory, string> = {
    devotional: "Telugu devotional bhajan",
    cinematic:  "Telugu film cinematic song",
    folk:       "Telugu folk (Janapada) song",
    romantic:   "Telugu romantic melody",
    emotional:  "Telugu emotional ballad",
    festival:   "Telugu festival celebration song",
    mass:       "Telugu mass hero anthem",
  };

  try {
    const response = await invokeLLM({
      messages: [{
        role: "user",
        content: `In 2-3 sentences, describe the subject "${subject}" for writing a ${categoryDescriptions[category]}. Include: the key emotions, imagery, setting, and any culturally specific references a Telugu lyricist should know. Be concise and specific.`,
      }],
    }, buildLLMOptions(llmApiKey, llmModel, openaiApiKey, claudeApiKey, groqApiKey, mistralApiKey));

    const content = response.choices[0]?.message.content;
    const context = typeof content === "string" && content.trim()
      ? content.trim()
      : `A ${categoryDescriptions[category]} about "${subject}".`;

    deityContextCache.set(cacheKey, context);
    return context;
  } catch {
    return `A ${categoryDescriptions[category]} about "${subject}". Capture the essence with authentic Telugu cultural references.`;
  }
}

// ── Category-aware system prompt builder ─────────────────────
function buildSystemPrompt(input: LyricsGenerationInput, subjectContext: string): string {
  const category = input.category || "devotional";
  const mood     = input.mood || "";
  const duration = input.duration || 4;

  const languageInstructions: Record<LanguageStyle, string> = {
    pure_telugu: "Write in pure, classical Telugu script with traditional vocabulary. Avoid Hindi or English words.",
    colloquial:  "Write in colloquial spoken Telugu — natural, everyday speech patterns. Regional flavour (Hyderabadi/Andhra) is welcome.",
    poetic:      "Write in rich poetic Telugu — classical metaphors, alankara (figures of speech), lyrical flow. Avoid mundane phrasing.",
    mixed:       "Write in mixed Telugu-English (Tenglish) — Telugu as the primary language, English words for contemporary concepts and hook lines.",
  };
  const langInstruction = input.languageStyle
    ? languageInstructions[input.languageStyle]
    : input.language === "english"
    ? "Write in English with transliterated Telugu deity/place names."
    : "Write in Telugu script.";

  const categoryInstructions: Record<SongCategory, string> = {
    devotional: `You are an expert Telugu devotional songwriter specialising in bhajans, keertanas, and stotrams.
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- Devotional reverence throughout; the singer speaks to or about the deity
- Include specific attributes, sacred locations, or mythological stories
- Use poetic devices: repetition, epithets, call-and-response
- Emotional arc: reverence → devotion → surrender → blessing`,

    cinematic: `You are an expert Telugu film lyricist (like Sirivennela, Ananta Sriram, Chandrabose).
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- Write for a specific cinematic moment (intro, romance, emotional, mass)
- Use strong visual imagery — every line should paint a film frame
- Mix classical Telugu references with contemporary relatable language
- Hook lines (mukhda) must be instantly memorable and repeatable
- Mass/intro songs: attitude, power, aggression; romantic: longing and beauty`,

    folk: `You are an expert Telugu folk (Janapada) lyricist.
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- Use rustic, village-life Telugu — simple, earthy, rhythmically percussive
- Reference nature: rivers, trees, seasons, animals, farming, village life
- Call-and-response structure works well (one line leads, next echoes)
- Avoid Sanskrit-heavy vocabulary; prefer spoken rural Telugu
- Rhythm should feel like it belongs to a Dappu beat`,

    romantic: `You are an expert Telugu romantic melody lyricist.
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- Write with soft, flowing language — every line evokes feeling, not just description
- Use nature metaphors: moon, rain, flowers, breeze, rivers
- First-person emotional perspective — the singer is in love, longing, or lost
- Avoid clichés; find fresh, specific images (a particular college, street, season)
- Mukhda should be instantly singable with the tune`,

    emotional: `You are an expert Telugu emotional ballad lyricist.
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- Write raw, honest emotion — no pretence, no decoration
- Ground every feeling in a specific concrete moment (a hand, a photo, a smell)
- Restraint is powerful — sometimes one simple line is more moving than ten
- Avoid melodrama; let the situation carry the weight
- Structure should allow the emotion to build slowly, then release`,

    festival: `You are an expert Telugu festival and celebration song lyricist.
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- High energy, celebratory, inclusive — everyone should want to join in
- Name specific festival customs, foods, clothing, rituals, and community moments
- Repeating hook / chorus that crowds can shout together
- Joy, colour, community, tradition — these are the anchors
- Rhythm should feel like it could drive a group dance`,

    mass: `You are an expert Telugu mass entertainer lyricist (mass hero anthem style).
SUBJECT CONTEXT:
${subjectContext}
STYLE RULES:
- Swagger, attitude, raw power — the hero (or concept) is larger than life
- Short, punchy lines with maximum impact; avoid long sentences
- Rhetorical questions and declarations work well ("Who dares face me?")
- Mix Telugu with occasional English for punch words
- Reference strength, loyalty, fear of enemies, pride of identity
- Every line should land like a film mass dialogue`,
  };

  const moodLine = mood ? `\nMOOD TARGET: ${mood}. Let this mood colour every line — word choice, rhythm, and imagery should all serve it.\n` : "";

  const sectionCounts = duration <= 2
    ? "• Pallavi: 3 lines\n• charanam1: 5 lines\n• charanam2, charanam3, charanam4, outro: leave empty strings"
    : duration <= 4
    ? "• Pallavi: 4 lines\n• charanam1: 6 lines\n• charanam2: 6 lines\n• charanam3, charanam4: leave empty strings\n• outro: 2 lines"
    : duration <= 6
    ? "• Pallavi: 4 lines\n• charanam1: 8 lines\n• charanam2: 8 lines\n• charanam3: 6 lines\n• charanam4: leave empty string\n• outro: 3 lines"
    : duration <= 8
    ? "• Pallavi: 4 lines\n• charanam1: 8 lines\n• charanam2: 8 lines\n• charanam3: 8 lines\n• charanam4: 6 lines\n• outro: 3 lines"
    : "• Pallavi: 5 lines\n• charanam1: 10 lines\n• charanam2: 10 lines\n• charanam3: 10 lines\n• charanam4: 8 lines\n• outro: 4 lines";

  const includeSceneNotes = input.outputType === "lyrics_scene";

  return `${categoryInstructions[category]}
${moodLine}
LANGUAGE: ${langInstruction}

SECTION COUNT FOR ${duration}-MINUTE TARGET (follow exactly):
${sectionCounts}

SONG STRUCTURE NOTE: Pallavi = chorus (repeats between each Charanam). Each line: 8–12 syllables, singable at ~4–5 seconds per line.

OUTPUT FORMAT:
Return ONLY a JSON object — no markdown fences, no preamble, no closing remarks.
CRITICAL rules:
1. Separate each song line with \\n inside the string — do NOT write multiple lines as one long sentence.
2. Do NOT add any English-only closing lines, blessings, congratulations, or meta-commentary after the lyrics. Pure song content only.
3. Every value must be in the target language and style — no stray English phrases unless the language style is "mixed".
{
  "pallavi": "line one\\nline two\\nline three",
  "charanam1": "line one\\nline two\\nline three\\nline four",
  "charanam2": "line one\\nline two\\n...",
  "charanam3": "",
  "charanam4": "",
  "outro": "",
  "notes": "Brief explanation of the lyrical theme and structure"${includeSceneNotes ? `,\n  "sceneNotes": "Brief notes on visual direction for each section (2-3 sentences per section)"` : ""}
}`;
}

// ── Category-aware SUNO style ────────────────────────────────
function generateSunoStyle(deity: string, category: SongCategory = "devotional", _theme?: string): SunoStyle {
  const preset = SUNO_PRESETS[category];

  // For devotional, refine by specific deity
  if (category === "devotional") {
    const key = deity.toLowerCase().trim();
    const deityOverrides: Record<string, Partial<SunoStyle>> = {
      venkateswara: { style: "Slow devotional bhajan, Nadaswaram-led", mood: "Divine & Majestic", instruments: ["Veena", "Mridangam", "Nadaswaram", "Flute"] },
      ganesha:      { style: "Energetic devotional keertana", mood: "Joyful & Celebratory", instruments: ["Tabla", "Dholak", "Flute", "Harmonium"], tempo: "energetic" },
      lakshmi:      { style: "Serene devotional bhajan", mood: "Graceful & Peaceful", instruments: ["Veena", "Sitar", "Flute", "Santoor"], vocals: "Female classical soprano", tempo: "slow" },
      shiva:        { style: "Carnatic classical keertana with Damaru rhythm", mood: "Meditative & Mystical", instruments: ["Damaru", "Veena", "Mridangam", "Flute"] },
      krishna:      { style: "Playful devotional bhajan, flute-led", mood: "Joyful & Longing", instruments: ["Flute", "Tabla", "Harmonium", "Mridangam"] },
      hanuman:      { style: "Heroic devotional bhajan", mood: "Heroic & Devotional", instruments: ["Mridangam", "Dholak", "Nadaswaram", "Veena"], vocals: "Powerful male devotional baritone" },
      durga:        { style: "Powerful Shakti bhajan with drumbeats", mood: "Powerful & Fierce", instruments: ["Dappu", "Nadaswaram", "Tabla", "Bells"], tempo: "energetic" },
      saraswati:    { style: "Pure Carnatic devotional, Veena-led", mood: "Serene & Graceful", instruments: ["Veena", "Flute", "Bells", "Violin"], vocals: "Female classical vocalist, gentle", tempo: "slow" },
      murugan:      { style: "South Indian devotional, Nadaswaram-led", mood: "Radiant & Devotional", instruments: ["Nadaswaram", "Mridangam", "Veena", "Flute"] },
      ayyappa:      { style: "Pilgrim bhajan, forest-sacred atmosphere", mood: "Austere & Devotional", instruments: ["Flute", "Mridangam", "Chenda", "Bells"], vocals: "Male group bhajan with call and response" },
    };
    const aliases: Record<string, string> = {
      balaji: "venkateswara", srinivasa: "venkateswara", govinda: "venkateswara",
      ganapati: "ganesha", vinayaka: "ganesha",
      mahalakshmi: "lakshmi",
      mahadeva: "shiva", shankar: "shiva",
      madhava: "krishna", radha: "krishna",
      anjaneya: "hanuman", maruti: "hanuman",
      shakti: "durga", bhavani: "durga",
      sharada: "saraswati",
      kartikeya: "murugan", skanda: "murugan",
      sastha: "ayyappa",
    };
    const resolvedKey = aliases[key] || key;
    const overrides = deityOverrides[resolvedKey] || {};
    return { ...preset, ...overrides };
  }

  return preset;
}

/**
 * Generate Telugu song lyrics using an LLM
 */
export async function generateDevotionalLyrics(
  input: LyricsGenerationInput
): Promise<GeneratedLyrics> {
  const duration = input.duration || 4;
  const category = input.category || "devotional";

  const subjectContext = await getSubjectContext(
    input.deity,
    category,
    input.llmApiKey,
    input.llmModel,
    input.openaiApiKey,
    input.claudeApiKey,
    input.groqApiKey,
    input.mistralApiKey,
  );

  let systemPrompt = buildSystemPrompt(input, subjectContext);

  if (input.customPrompt) {
    systemPrompt += `\n\nUSER DIRECTION:\n${input.customPrompt}\n\nIncorporate this direction. REMINDER: output valid JSON only — every song line separated by \\n, no English artifact endings, no markdown.`;
  }

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const userMessage = input.directivePrompt
    ? `${input.directivePrompt}\n\n(Subject: ${input.deity}, Category: ${categoryLabel}, Duration: ${duration} min, Language: ${input.languageStyle || input.language || "telugu"})`
    : `Create a ${duration}-minute ${categoryLabel} song about "${input.deity}"${input.mood ? ` with a ${input.mood} mood` : ""}${input.theme ? ` — theme: "${input.theme}"` : ""}.`;

  const includeSceneNotes = input.outputType === "lyrics_scene";

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
      temperature: 1.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "song_lyrics",
          strict: true,
          schema: {
            type: "object",
            properties: {
              pallavi:    { type: "string", description: "Chorus / mukhda (2-5 lines)" },
              charanam1:  { type: "string", description: "First verse (4-10 lines)" },
              charanam2:  { type: "string", description: "Second verse (optional)" },
              charanam3:  { type: "string", description: "Third verse (optional, 5+ min)" },
              charanam4:  { type: "string", description: "Fourth verse (optional, 7+ min)" },
              outro:      { type: "string", description: "Closing section (optional)" },
              notes:      { type: "string", description: "Brief explanation of the lyrical theme" },
              ...(includeSceneNotes ? { sceneNotes: { type: "string", description: "Visual direction notes per section" } } : {}),
            },
            required: ["pallavi", "charanam1", "notes"],
            additionalProperties: false,
          },
        },
      },
    }, buildLLMOptions(input.llmApiKey, input.llmModel, input.openaiApiKey, input.claudeApiKey, input.groqApiKey, input.mistralApiKey));

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const jsonStr = contentStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: {
      pallavi: string; charanam1: string;
      charanam2?: string; charanam3?: string; charanam4?: string;
      outro?: string; notes: string; sceneNotes?: string;
    };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[LyricsGeneration] Invalid JSON from LLM:", contentStr);
      throw new Error("LLM returned malformed JSON — please try generating again.");
    }

    const normalizeLines = (s?: string) => (s || "").replace(/\\n/g, "\n").trim();

    parsed.pallavi   = normalizeLines(parsed.pallavi);
    parsed.charanam1 = normalizeLines(parsed.charanam1);
    parsed.charanam2 = normalizeLines(parsed.charanam2);
    parsed.charanam3 = normalizeLines(parsed.charanam3);
    parsed.charanam4 = normalizeLines(parsed.charanam4);
    parsed.outro     = normalizeLines(parsed.outro);

    const lyrics = [
      `[Pallavi]\n${parsed.pallavi}`,
      `\n[Charanam 1]\n${parsed.charanam1}`,
      parsed.charanam2 ? `\n[Charanam 2]\n${parsed.charanam2}` : "",
      parsed.charanam3 ? `\n[Charanam 3]\n${parsed.charanam3}` : "",
      parsed.charanam4 ? `\n[Charanam 4]\n${parsed.charanam4}` : "",
      parsed.outro ? `\n[Outro]\n${parsed.outro}` : "",
    ].filter(Boolean).join("");

    const sunoStyle = input.outputType === "lyrics_only"
      ? undefined
      : generateSunoStyle(input.deity, category, input.theme);

    return {
      lyrics,
      sunoStyle,
      sceneNotes: parsed.sceneNotes,
      structure: {
        pallavi:   parsed.pallavi,
        charanam1: parsed.charanam1,
        charanam2: parsed.charanam2 || "",
        charanam3: parsed.charanam3 || "",
        charanam4: parsed.charanam4 || "",
        outro:     parsed.outro || "",
      },
      metadata: {
        deity: input.deity,
        theme: input.theme,
        category,
        estimatedDuration: duration,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[LyricsGeneration] Error:", error);
    throw new Error(`Failed to generate lyrics: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function regenerateLyrics(input: LyricsGenerationInput): Promise<GeneratedLyrics> {
  return generateDevotionalLyrics(input);
}
