// ============================================================
// DESIGN: "Digital Sanctum" — all data for the studio workflow
// ============================================================

export type DeityKey = "venkateswara" | "ganesha" | "lakshmi" | "shiva" | (string & {});

export interface Deity {
  key: DeityKey;
  name: string;
  teluguName: string;
  mood: string;
  audience: string;
  instruments: string[];
  themes: string[];
  visualStyle: string;
  color: string; // accent color for the deity card
}

export const DEITIES: Deity[] = [
  {
    key: "venkateswara",
    name: "Venkateswara Swamy",
    teluguName: "వేంకటేశ్వర స్వామి",
    mood: "Divine, Majestic, Devotional",
    audience: "Tirupati devotees, Vaishnava community",
    instruments: ["Veena", "Mridangam", "Nadaswaram", "Flute"],
    themes: ["Govinda", "Srinivasa", "Balaji", "Tirumala", "Alipiri"],
    visualStyle: "Golden crown, black idol, garlands, seven hills",
    color: "#D4A017",
  },
  {
    key: "ganesha",
    name: "Ganesha",
    teluguName: "గణేశుడు",
    mood: "Joyful, Auspicious, Energetic",
    audience: "All devotees, especially during Vinayaka Chavithi",
    instruments: ["Tabla", "Dholak", "Flute", "Harmonium"],
    themes: ["Vighneshwara", "Ganapati", "Lambodara", "Modaka", "Mushika"],
    visualStyle: "Elephant head, lotus, modak, mouse vehicle",
    color: "#E8820C",
  },
  {
    key: "lakshmi",
    name: "Lakshmi",
    teluguName: "లక్ష్మీ దేవి",
    mood: "Serene, Graceful, Auspicious",
    audience: "Devotees seeking prosperity, Diwali celebrations",
    instruments: ["Veena", "Flute", "Sitar", "Santoor"],
    themes: ["Mahalakshmi", "Dhanalakshmi", "Lotus", "Gold coins", "Elephants"],
    visualStyle: "Pink lotus, gold coins, red saree, white elephants",
    color: "#C8570A",
  },
  {
    key: "shiva",
    name: "Shiva",
    teluguName: "శివుడు",
    mood: "Powerful, Mystical, Transcendent",
    audience: "Shaiva devotees, Maha Shivaratri celebrations",
    instruments: ["Damaru", "Rudra Veena", "Flute", "Mridangam"],
    themes: ["Mahadeva", "Nataraja", "Lingam", "Trishul", "Ganga", "Nandi"],
    visualStyle: "Blue throat, crescent moon, trident, ash, Ganga",
    color: "#6B8DD6",
  },
];

export interface SunoStyle {
  tempo: string;
  style: string;
  instruments: string[];
  mood: string;
  vocals: string;
}

export const TEMPO_OPTIONS = [
  { value: "slow", label: "Slow Bhajan (60–70 BPM)" },
  { value: "medium", label: "Medium Devotional (80–100 BPM)" },
  { value: "energetic", label: "Energetic Keertana (110–130 BPM)" },
  { value: "classical", label: "Classical Carnatic (variable)" },
];

export const INSTRUMENT_OPTIONS = [
  "Veena", "Mridangam", "Flute", "Nadaswaram", "Harmonium",
  "Tabla", "Sitar", "Santoor", "Dholak", "Damaru", "Bells",
  "Violin", "Ghatam", "Kanjira",
];

export const MOOD_OPTIONS = [
  "Divine & Calm", "Majestic & Powerful", "Joyful & Celebratory",
  "Meditative & Peaceful", "Emotional & Devotional", "Mystical & Transcendent",
];

export interface Scene {
  id: number;
  lyricLine: string;
  sceneDescription: string;
  imagePrompt: string;
  motionPrompt: string;
  duration: number; // seconds
}

export interface Project {
  id: string;
  deity: DeityKey | null;
  title: string;
  lyrics: string;
  sunoStyle: SunoStyle;
  scenes: Scene[];
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string[];
  thumbnailPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export function createEmptyProject(): Project {
  return {
    id: Date.now().toString(),
    deity: null,
    title: "",
    lyrics: "",
    sunoStyle: {
      tempo: "slow",
      style: "Bhajan",
      instruments: [],
      mood: "Divine & Calm",
      vocals: "Male devotional tenor",
    },
    scenes: [],
    youtubeTitle: "",
    youtubeDescription: "",
    youtubeTags: [],
    thumbnailPrompt: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Lyrics templates per deity ──────────────────────────────
export const LYRICS_TEMPLATES: Record<DeityKey, string> = {
  venkateswara: `[Pallavi]
గోవింద గోవింద వేంకటేశ గోవింద
శ్రీనివాస బాలాజీ గోవింద గోవింద

[Charanam 1]
ఏడు కొండలపై నిలిచిన స్వామి
భక్తుల మనసులో వెలిగే దేవుడు
అలిపిరి మెట్లు ఎక్కి వచ్చాం స్వామి
నీ పాదాల దగ్గర శరణు కోరాం

[Charanam 2]
దీపాలు వెలిగించి నీకు అర్పించాం
పూలమాలలు నీకు సమర్పించాం
మా పాపాలు తొలగించు స్వామి
మా కోరికలు తీర్చు వేంకటేశ`,

  ganesha: `[Pallavi]
గణపతి బప్పా మోరయా
విఘ్నేశ్వరా నమో నమః

[Charanam 1]
లంబోదర గజముఖుడా
మోదకప్రియ వినాయకా
మూషికవాహన విఘ్నహరా
ముందుగా నీకు మొక్కుతాం

[Charanam 2]
బుద్ధిప్రదాయక గణేశా
సిద్ధిప్రదాయక వినాయకా
ఆనందమూర్తి గణపతి
ఆశీర్వదించు మాకు నీవు`,

  lakshmi: `[Pallavi]
మహాలక్ష్మి నమో నమః
ధనలక్ష్మి నమో నమః

[Charanam 1]
పద్మాసనపై కూర్చున్న తల్లి
బంగారు వర్ణపు కాంతి వెలిగించే
ఏనుగులు నీకు అభిషేకం చేస్తే
లక్ష్మీ తల్లి మాకు దయ చూపించు

[Charanam 2]
ధనధాన్యాలు ఇచ్చే తల్లివి
సంపదలు ప్రసాదించే దేవివి
మా ఇంట్లో వెలుగు నింపు తల్లి
మా జీవితాలు సుఖమయం చేయి`,

  shiva: `[Pallavi]
ఓం నమః శివాయ
మహాదేవా శంభో శంకరా

[Charanam 1]
కైలాసపర్వతంపై కూర్చున్న స్వామి
గంగను జటాజూటంలో ధరించిన దేవుడు
నందిని వాహనంగా చేసుకున్న శివుడు
త్రిశూలం పట్టుకున్న మహేశ్వరుడు

[Charanam 2]
నటరాజుగా నాట్యమాడే స్వామి
లింగరూపంలో పూజలందుకునే దేవుడు
భస్మం పూసుకున్న భోళాశంకరుడు
మా పాపాలు తొలగించు మహాదేవా`,
};

// ── Scene prompt templates ───────────────────────────────────
export function generateImagePrompt(scene: Scene, deity: Deity): string {
  return `Cinematic devotional scene: ${scene.sceneDescription}. South Indian Hindu temple setting, warm amber and gold lighting from oil lamps, incense smoke, intricate stone carvings, Tanjore painting style color palette with deep jewel tones, ultra-detailed, 8K quality, sacred and divine atmosphere, no text overlays`;
}

export function generateMotionPrompt(scene: Scene): string {
  return `Gentle cinematic motion: ${scene.sceneDescription}. Slow camera push-in (0.3x zoom), soft particle glow on light sources, subtle smoke drift, lamp flames flickering, 6-second loop, smooth and meditative movement, no abrupt cuts`;
}

// ── YouTube metadata generator ───────────────────────────────
export function generateYouTubeMetadata(project: Project, deity: Deity) {
  const deityName = deity.name;
  const teluguName = deity.teluguName;
  const title = project.title || `${deityName} Telugu Devotional Song`;

  const youtubeTitle = `${title} | ${teluguName} | Telugu Bhakti Songs 2024 | 4K`;

  const description = `🙏 ${title} — A devotional offering to ${deityName} (${teluguName})

🎵 About This Song:
This sacred Telugu devotional song is composed with love and devotion for ${deityName}. 
Featuring traditional South Indian classical instruments including ${deity.instruments.slice(0, 3).join(", ")}.

📿 Mood: ${deity.mood}
🎼 Style: Traditional Telugu Bhakti

⸻

🔔 Subscribe for more Telugu devotional content:
✅ New songs every week
✅ 4K devotional videos
✅ Traditional and classical bhajans

⸻

📖 Lyrics are in Telugu — scroll down for the full text in the comments.

🙏 Jai ${deityName}! 🙏

#Telugu #Devotional #${deityName.replace(/\s/g, "")} #TeluguBhakti #BhaktiSongs #HinduDevotion #${teluguName.replace(/\s/g, "")} #TeluguSongs #Bhajan #SpiritualMusic`;

  const tags = [
    "Telugu devotional songs",
    `${deityName} songs`,
    `${deityName} Telugu`,
    "Telugu bhakti songs",
    "Telugu bhajan",
    "Hindu devotional songs",
    "South Indian devotional",
    "Telugu spiritual songs",
    "4K devotional video",
    ...deity.themes.map((t) => `${t} song`),
    ...deity.themes,
    "Telugu songs 2024",
    "devotional music",
    "bhakti songs Telugu",
    teluguName,
  ];

  const thumbnailPrompt = `YouTube thumbnail for Telugu devotional song about ${deityName}: ${deity.visualStyle}. Dramatic lighting with warm gold and amber tones, ${deityName} in center with divine glow, ornate temple background, bold Telugu text "${title}" at bottom in gold, cinematic composition, 16:9 ratio, high contrast, visually striking`;

  return { youtubeTitle, description, tags, thumbnailPrompt };
}
