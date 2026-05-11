// ============================================================
// DESIGN: "Digital Sanctum" — Step 5: Scene Breakdown Generator
// Auto-generates scenes from lyrics, each lyric → one visual
// Director Mode: emotional arc + shot vocabulary via LLM agent
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, Scene, EmotionalWeight, ShotType, CameraMovement } from "@/lib/studioData";
import { ChevronRight, Wand2, Plus, Trash2, Undo2, Clapperboard, Info } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Scene suggestion templates per deity — keyword-matched to lyric lines
const SCENE_TEMPLATES: Record<string, { keywords: string[]; description: string }[]> = {
  venkateswara: [
    { keywords: ["govinda", "గోవింద"], description: "Thousands of devotees chanting Govinda with hands raised, golden temple gopuram in background" },
    { keywords: ["alipiri", "అలిపిరి", "మెట్లు"], description: "Stone steps of Alipiri covered with barefoot pilgrims, lush green hills, misty morning" },
    { keywords: ["deepam", "దీపం", "lamp"], description: "Row of brass oil lamps (diyas) burning in temple corridor, golden light on black granite floor" },
    { keywords: ["tirumala", "తిరుమల", "hills", "కొండ"], description: "Aerial view of Tirumala seven hills at sunrise, golden mist, temple visible at peak" },
    { keywords: ["darshan", "దర్శన"], description: "Close-up of golden idol of Venkateswara with flower garlands, divine glow, incense smoke" },
    { keywords: ["prasad", "ప్రసాద", "laddu"], description: "Tirupati laddu prasad being distributed, golden light, devotees receiving with folded hands" },
    { keywords: ["pushkarini", "పుష్కరిణి"], description: "Sacred Swami Pushkarini lake at dawn, lotus flowers, temple reflection in still water" },
    { keywords: ["bell", "గంట", "nadaswaram"], description: "Temple bells ringing, nadaswaram musicians playing, flower petals falling from above" },
  ],
  ganesha: [
    { keywords: ["ganapati", "గణపతి", "ganesha", "వినాయక"], description: "Magnificent Ganesha idol with golden crown, surrounded by marigold flowers and diyas" },
    { keywords: ["modak", "మోదక"], description: "Plate of modak sweets offered to Ganesha, golden light, incense smoke curling upward" },
    { keywords: ["mushika", "mouse", "వాహన", "ఎలుక"], description: "Ganesha's mouse vehicle at his feet, tiny and humble, surrounded by flowers" },
    { keywords: ["lotus", "కమలం"], description: "Pink lotus flowers floating on sacred water, morning light, temple bells in background" },
    { keywords: ["procession", "శోభాయాత్ర", "chavithi", "చవితి"], description: "Colorful Ganesh Chaturthi procession through streets, drums, flowers, joyful devotees" },
    { keywords: ["tusk", "దంత", "ekadanta", "ఏకదంత"], description: "Close-up of Ganesha's symbolic broken tusk, golden ornaments, sacred atmosphere" },
    { keywords: ["vighn", "విఘ్న", "obstacle"], description: "Ganesha removing obstacles — rocky path clearing as divine light shines ahead" },
  ],
  lakshmi: [
    { keywords: ["lotus", "కమలం", "padma"], description: "Goddess Lakshmi seated on pink lotus, golden light, white elephants on either side" },
    { keywords: ["gold", "బంగారు", "coins", "నాణేలు"], description: "Gold coins flowing from Lakshmi's hands, abundance and prosperity, warm golden light" },
    { keywords: ["elephant", "ఏనుగు", "gajaraj"], description: "Two white elephants performing abhishek with water trunks, sacred and majestic" },
    { keywords: ["diya", "దీప", "lamp", "deepam"], description: "Rows of lit diyas in a dark room, warm amber glow, flower petals scattered" },
    { keywords: ["saree", "వస్త్రం", "red", "ఎరుపు"], description: "Red silk saree with golden border, divine feminine grace, ornate temple setting" },
    { keywords: ["prosperity", "సంపద", "wealth", "dhana", "ధన"], description: "Overflowing pot of gold and jewels, lotus flowers, divine abundance" },
    { keywords: ["diwali", "దీపావళి", "festival"], description: "Rows of diyas lighting up a dark doorway, Diwali night celebration, golden glow" },
  ],
  shiva: [
    { keywords: ["kailash", "కైలాస"], description: "Snow-capped Mount Kailash at dawn, divine golden light, mystical clouds" },
    { keywords: ["nataraja", "నటరాజ", "dance", "నృత్యం"], description: "Shiva as Nataraja in cosmic dance, ring of fire, divine energy" },
    { keywords: ["lingam", "లింగం", "abhishek"], description: "Shiva lingam with milk abhishek, flowers, bilva leaves, sacred atmosphere" },
    { keywords: ["ganga", "గంగ", "river"], description: "Sacred Ganga river flowing from Shiva's matted hair, moonlit night" },
    { keywords: ["trishul", "త్రిశూల", "trident"], description: "Shiva's trident glowing with divine energy, mountain peaks in background" },
    { keywords: ["nandi", "నంది"], description: "White Nandi bull facing Shiva lingam, sacred and devoted, temple setting" },
    { keywords: ["moon", "చంద్రుడు", "crescent"], description: "Crescent moon in Shiva's matted hair, dark blue night sky, stars shining" },
    { keywords: ["ash", "భస్మం", "bhasma", "vibhuti"], description: "Sacred vibhuti (ash) being applied in three horizontal lines, divine ritual" },
    { keywords: ["shivaratri", "శివరాత్రి"], description: "Maha Shivaratri night puja — crowds of devotees with oil lamps around a huge Shiva lingam" },
  ],
  krishna: [
    { keywords: ["flute", "వేణువు", "bansuri", "మురళి"], description: "Krishna playing the divine flute under a Kadamba tree, moonlit Vrindavan, cows listening" },
    { keywords: ["radha", "రాధ", "brindavan", "బృందావన"], description: "Radha and Krishna in divine union, surrounded by golden lotus flowers, soft moonlight" },
    { keywords: ["govinda", "గోవింద", "butter", "వెన్న"], description: "Baby Krishna stealing butter, mischievous smile, earthen pot, soft golden light" },
    { keywords: ["gita", "గీత", "chariot", "రథం"], description: "Krishna as charioteer in the Kurukshetra battlefield, Arjuna listening, divine glow" },
    { keywords: ["mathura", "మథుర", "vrindavan", "వృందావన"], description: "Sacred Vrindavan forest at dusk, peacocks dancing, divine blue light filtering through trees" },
    { keywords: ["peacock", "నెమలి", "feather", "పింఛం"], description: "Peacock feather crown of Krishna, divine blue beauty, temple setting" },
    { keywords: ["gopi", "గోపి", "dance", "raas", "రాస్"], description: "Raas Leela — Krishna dancing with gopis in a circle, golden lamps, divine joy" },
    { keywords: ["janmashtami", "జన్మాష్టమి"], description: "Janmashtami celebration — Baby Krishna in a golden cradle, flowers, devotees singing" },
  ],
  hanuman: [
    { keywords: ["anjaneya", "అంజనేయ", "hanuman", "హనుమాన్"], description: "Majestic Hanuman idol in devotional pose, mountains in background, divine orange glow" },
    { keywords: ["rama", "రామ", "seva", "సేవ"], description: "Hanuman bowing at Rama's feet with complete devotion, lotus flowers, temple light" },
    { keywords: ["ocean", "సముద్రం", "fly", "ఎగురు", "lanka"], description: "Hanuman leaping across the ocean, fiery tail, Lanka visible in distance, night sky" },
    { keywords: ["sita", "సీత", "ring", "ఉంగరం"], description: "Hanuman presenting Rama's ring to Sita in Ashoka garden, moonlight, tears of joy" },
    { keywords: ["mountain", "కొండ", "sanjeevani", "సంజీవని"], description: "Hanuman carrying the entire Dronagiri mountain with sacred herbs, divine strength" },
    { keywords: ["strength", "బలం", "shakti", "శక్తి"], description: "Hanuman in powerful Panchamukha (five-faced) form, divine energy, blazing light" },
    { keywords: ["prayer", "ప్రార్థన", "bhakta"], description: "Hanuman Chalisa recitation — devotees around an oil lamp at dawn, hands folded" },
  ],
  rama: [
    { keywords: ["ayodhya", "అయోధ్య"], description: "Grand Ayodhya cityscape — Ram Mandir with golden spires, Sarayu river, dawn light" },
    { keywords: ["sita", "సీత", "wife", "consort"], description: "Rama and Sita seated on golden throne together, Hanuman at their feet, lotus flowers" },
    { keywords: ["forest", "అడవి", "vanavasa", "వనవాస"], description: "Rama, Sita, and Lakshmana walking through lush forest, birds following, divine light" },
    { keywords: ["bow", "ధనుస్సు", "arrow", "బాణం"], description: "Rama drawing his divine bow (Kodanda), determined and righteous, golden light" },
    { keywords: ["bridge", "వంతెన", "setu", "ocean"], description: "Rama Setu — the divine bridge across the ocean built by Vanarasena, twilight sky" },
    { keywords: ["crown", "పట్టాభిషేకం", "king", "raja"], description: "Rama's coronation (Pattabhisheka) in Ayodhya — golden throne, flower rain, divine light" },
    { keywords: ["hanuman", "హనుమ", "devotee"], description: "Hanuman opening his heart to reveal Rama and Sita inside, divine golden glow" },
  ],
  saraswati: [
    { keywords: ["veena", "వీణ", "music", "sangeet"], description: "Goddess Saraswati playing the Veena on a white lotus, divine music notes floating in air" },
    { keywords: ["swan", "హంస", "white", "తెలుపు"], description: "White swan beside Saraswati on a lotus pond, pure white feathers, morning light" },
    { keywords: ["book", "పుస్తకం", "knowledge", "vidya", "విద్య"], description: "Saraswati holding sacred books and lotus, divine wisdom flowing, white and gold palette" },
    { keywords: ["student", "విద్యార్థి", "learning", "blessings"], description: "Students bowing before Saraswati idol, flowers, oil lamps, seeking divine blessings" },
    { keywords: ["puja", "పూజ", "vasant", "panchami"], description: "Vasant Panchami celebration — yellow flowers, marigolds, golden light, Saraswati puja" },
    { keywords: ["river", "నది", "flowing"], description: "Sacred river Saraswati flowing with divine light, lotus flowers, misty morning" },
  ],
  durga: [
    { keywords: ["lion", "సింహం", "vahana", "వాహన"], description: "Durga on her lion vehicle, fierce and radiant, ten arms holding weapons, divine fire" },
    { keywords: ["mahishasura", "మహిషాసుర", "victory", "vijay"], description: "Durga slaying Mahishasura — dynamic fierce pose, divine sword, buffalo demon defeated" },
    { keywords: ["navratri", "నవరాత్రి", "nine", "nights"], description: "Nine nights of Navratri — colorful garba dancers, lit diyas, Durga idol in center" },
    { keywords: ["weapons", "ఆయుధాలు", "ten", "arms"], description: "Close-up of Durga's ten divine arms each holding a sacred weapon, golden glow" },
    { keywords: ["mother", "అమ్మ", "amma", "mata"], description: "Durga as the divine mother — compassionate and fierce simultaneously, devotees at her feet" },
    { keywords: ["protection", "రక్షణ", "shakti", "శక్తి"], description: "Divine Shakti energy radiating from Durga, blue-and-gold sacred light, protective aura" },
    { keywords: ["devi", "దేవి", "bhavani", "भवानी"], description: "Durga Devi in full divine form — golden ornaments, red saree, fierce compassionate eyes" },
  ],
  murugan: [
    { keywords: ["vel", "వేల్", "spear", "शक्ति"], description: "Murugan's divine Vel (spear) glowing with sacred energy, peacock in background, golden light" },
    { keywords: ["peacock", "నెమలి", "mayura", "vahana"], description: "Murugan riding his peacock vahana, feathers spread in glory, sunset sky" },
    { keywords: ["palani", "పాలని", "hill", "temple"], description: "Palani Murugan temple on the hilltop, devotees climbing, golden dawn light" },
    { keywords: ["valli", "వల్లి", "devasena", "consort"], description: "Murugan with Valli and Devasena on either side, divine radiance, lotus throne" },
    { keywords: ["kavadi", "కవాడి", "pilgrim"], description: "Kavadi pilgrims in colorful attire carrying ornate kavadis, spiritual procession" },
    { keywords: ["shanmukha", "షణ్ముఖ", "six", "faces"], description: "Shanmukha — Murugan's six-faced form, each face radiant and divine, sacred light" },
    { keywords: ["skanda", "స్కంద", "war", "victory"], description: "Murugan as divine commander Skanda — spear raised, peacock beside, victorious" },
  ],
  narasimha: [
    { keywords: ["prahlada", "ప్రహ్లాద"], description: "Young Prahlada praying fearlessly while Hiranyakashipu threatens, divine light protecting him" },
    { keywords: ["pillar", "స్తంభం", "emerge", "వెలువడు"], description: "Narasimha emerging from the golden pillar — half-man half-lion form, fierce divine light" },
    { keywords: ["hiranyakashipu", "హిరణ్యకశిప", "demon"], description: "Narasimha subduing Hiranyakashipu — fierce and protective, twilight hour (Sandhya)" },
    { keywords: ["ahobilam", "అహోబిలం", "temple", "shrine"], description: "Sacred Ahobilam temple complex in the Nallamala hills, divine forest, stone carvings" },
    { keywords: ["fierce", "ఉగ్ర", "ugra", "roar"], description: "Ugra Narasimha — fierce lion face with divine mane, golden energy radiating outward" },
    { keywords: ["lakshmi", "లక్ష్మి", "consort", "shanta"], description: "Shanta (calm) Narasimha with Lakshmi on his lap, devotees offering prayers" },
  ],
  ayyappa: [
    { keywords: ["sabarimala", "శబరిమల", "temple", "shrine"], description: "Sabarimala temple atop the sacred mountain at night, star-lit sky, devotee camp fires" },
    { keywords: ["18 steps", "18 మెట్లు", "pathinettam", "padi"], description: "The 18 sacred Pathinettampadi steps at Sabarimala, devotees climbing in black attire" },
    { keywords: ["swami", "స్వామి", "saranam", "శరణం"], description: "Devotees chanting 'Swamiye Saranam Ayyappa', hands raised, divine forest atmosphere" },
    { keywords: ["deeksha", "దీక్ష", "mandalam", "41 days"], description: "Ayyappa devotees in black attire carrying holy Irumudi on their heads, forest path" },
    { keywords: ["makara", "మకర", "vilakku", "star"], description: "Makaravilakku night — the divine star appearing over Sabarimala, thousands of lamps" },
    { keywords: ["forest", "అడవి", "tiger", "పులి"], description: "Sacred forest path to Sabarimala — tall trees, divine mist, a distant tiger retreating" },
    { keywords: ["bell", "గంట", "puja", "worship"], description: "Evening puja at Ayyappa temple — lit diyas, incense, bell sounds, devotional chanting" },
  ],
};

// Fallback scene visuals — cycled when no keyword template matches.
// Variety ensures every unmatched lyric line gets a distinct image prompt.
const FALLBACK_SCENES = [
  "Temple sanctum interior — rows of brass oil lamps on granite steps, golden glow, incense smoke rising",
  "Close-up of sacred flower garlands on stone deity — marigold, jasmine, and lotus layered with gold",
  "Devotees with folded hands in silent prayer, soft amber lamp-light on their faces, deep shadows behind",
  "Ancient temple gopuram at twilight — temple bells in silhouette, birds rising, sky turning rose-gold",
  "Camphor aarti flame being waved before the idol, devotees' faces lit golden, eyes closed in devotion",
  "Carved stone temple corridor lined with oil lamps receding into darkness, intricate pillars, sacred mist",
  "Hands offering bilva leaves and jasmine to a polished lingam, water drops glistening, candlelight close-up",
  "Temple courtyard at dawn — dew on lotus flowers in the tank, first light catching stone carvings",
  "Ritual bell hanging in temple archway, golden sheen, marigold garlands draped around it, soft bokeh",
  "Sacred fire (havan kund) with priests in white, orange flames rising, sparks drifting upward",
  "Feet of the deity adorned with anklets and flower offerings — close detail, stone floor, lamp glow",
  "Aerial view of temple tank at dusk, oil lamp floats on still water, reflection of gopuram wavering",
  "Stone chariot wheels of a temple — intricate carvings, warm afternoon sun, pigeons on the steps",
  "Priest performing abhishek — water cascading over the idol, flowers swirling, silver vessel gleaming",
  "Temple threshold with a lit brass diya at either side, banana leaves as decoration, devotee silhouette",
  "Fragrant sandalwood paste being applied to stone idol by devotee's fingers, candle nearby, macro detail",
];

function generateScenesFromLyrics(lyrics: string, deityKey: string): Scene[] {
  const lines = lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("[") && l.length > 3);

  const templates = SCENE_TEMPLATES[deityKey] || [];
  // Track which keyword-templates have already been used so each fires at most once
  const usedTemplateIndices = new Set<number>();

  return lines.slice(0, 32).map((line, i) => {
    const lowerLine = line.toLowerCase();

    // Find the first unused template that matches this lyric line
    let matchedDesc: string | null = null;
    for (let j = 0; j < templates.length; j++) {
      if (!usedTemplateIndices.has(j) && templates[j].keywords.some((k) => lowerLine.includes(k.toLowerCase()))) {
        matchedDesc = templates[j].description;
        usedTemplateIndices.add(j);
        break;
      }
    }

    // If no unused template matched, use a rotating fallback (guarantees visual variety)
    const sceneDesc = matchedDesc ?? FALLBACK_SCENES[i % FALLBACK_SCENES.length];

    return {
      id: i + 1,
      lyricLine: line,
      sceneDescription: sceneDesc,
      imagePrompt: `Cinematic devotional scene: ${sceneDesc}. South Indian Hindu temple, warm amber oil lamp lighting, incense smoke wisps, intricate stone carvings, Tanjore painting color palette, ultra-detailed, sacred atmosphere, 8K quality, no text`,
      motionPrompt: `Gentle slow camera push-in (0.3x zoom over 6 seconds): ${sceneDesc}. Soft particle glow on light sources, subtle smoke drift, lamp flames flickering, smooth meditative motion`,
      duration: 5,
    };
  });
}

// ── Emotional weight display config ──────────────────────────
const WEIGHT_CONFIG: Record<EmotionalWeight, { label: string; color: string; bg: string }> = {
  reverent:    { label: "Reverent",    color: "oklch(0.65 0.08 230)", bg: "oklch(0.18 0.04 230 / 0.5)" },
  longing:     { label: "Longing",     color: "oklch(0.72 0.12 55)",  bg: "oklch(0.18 0.06 55 / 0.5)"  },
  devotional:  { label: "Devotional",  color: "oklch(0.75 0.12 75)",  bg: "oklch(0.18 0.06 75 / 0.5)"  },
  ecstatic:    { label: "Ecstatic",    color: "oklch(0.88 0.15 85)",  bg: "oklch(0.20 0.08 85 / 0.5)"  },
  surrendered: { label: "Surrendered", color: "oklch(0.60 0.06 180)", bg: "oklch(0.16 0.03 180 / 0.5)" },
};

const SHOT_CONFIG: Record<ShotType, { label: string; abbr: string }> = {
  WS:  { label: "Wide Shot",     abbr: "WS" },
  MS:  { label: "Medium Shot",   abbr: "MS" },
  CU:  { label: "Close-Up",      abbr: "CU" },
  ECU: { label: "Extreme CU",    abbr: "ECU" },
};

const MOVE_CONFIG: Record<CameraMovement, { label: string }> = {
  "push-in":   { label: "Push In" },
  "pull-back": { label: "Pull Back" },
  "pan":       { label: "Pan" },
  "tilt-up":   { label: "Tilt Up" },
  "static":    { label: "Static" },
};

export default function Step5Scenes() {
  const {
    project, setScenes, setActiveStep, markStepComplete,
    undoScenes, canUndoScenes, setCinematicStyle, updateScene,
  } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDirectorNotes, setShowDirectorNotes] = useState(true);
  const [showStyleSheet, setShowStyleSheet] = useState(false);
  const [llmModel, setLlmModel] = useState("gemini-2.5-flash");
  const deity = DEITIES.find((d) => d.key === project.deity);

  const directorMutation      = trpc.generation.directorAnalysis.useMutation();
  const sceneBreakdownMutation = trpc.generation.generateSceneBreakdown.useMutation();

  const hasDirectorData = project.scenes.some((s) => s.emotionalWeight);

  const handleAutoGenerate = async () => {
    if (!project.lyrics || !project.lyrics.trim()) {
      toast.error("Please write lyrics in Step 1 first");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await sceneBreakdownMutation.mutateAsync({
        lyrics:   project.lyrics,
        deity:    project.deity    || undefined,
        category: (project as any).category || undefined,
        mood:     (project as any).mood     || undefined,
        llmModel,
      });
      if (!result.success || !result.data) throw new Error(result.error || "Scene breakdown failed");
      setScenes(result.data.scenes as any);
      toast.success(`Generated ${result.data.scenes.length} scenes from your lyrics!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate scenes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectorAnalysis = async () => {
    if (project.scenes.length === 0) {
      toast.error("Generate scenes first before running Director Analysis");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await directorMutation.mutateAsync({
        deity: deity?.name || project.deity || "Deity",
        scenes: project.scenes.map((s) => ({
          sceneId: s.id,
          lyricLine: s.lyricLine,
          sceneDescription: s.sceneDescription,
        })),
        llmModel,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Director analysis failed");
      }

      // Apply enriched prompts + director fields to each scene
      const updatedScenes = project.scenes.map((scene) => {
        const directed = result.data!.scenes.find((d) => d.id === scene.id);
        if (!directed) return scene;
        return {
          ...scene,
          emotionalWeight: directed.emotionalWeight as EmotionalWeight,
          shotType: directed.shotType as ShotType,
          cameraMovement: directed.cameraMovement as CameraMovement,
          directorNote: directed.directorNote,
          imagePrompt: directed.enrichedImagePrompt || scene.imagePrompt,
          motionPrompt: directed.enrichedMotionPrompt || scene.motionPrompt,
        };
      });
      setScenes(updatedScenes);
      setCinematicStyle(result.data.cinematicStyle);
      setShowStyleSheet(true);
      toast.success("Director Analysis complete — shot vocabulary applied to all scenes!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Director analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now() + Math.floor(Math.random() * 100000),
      lyricLine: "",
      sceneDescription: "",
      imagePrompt: "",
      motionPrompt: "",
      duration: 5,
    };
    setScenes([...project.scenes, newScene]);
  };

  const handleDeleteScene = (id: number) => {
    setScenes(project.scenes.filter((s) => s.id !== id));
  };

  const handleUpdateScene = (id: number, field: keyof Scene, value: string | number) => {
    setScenes(
      project.scenes.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleContinue = () => {
    if (project.scenes.length === 0) {
      toast.error("Please generate or add at least one scene");
      return;
    }
    markStepComplete(3);
    setActiveStep(4);
  };

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  // Emotional arc visualization data
  const arcColors: Record<EmotionalWeight, string> = {
    reverent:    "#6699cc",
    longing:     "#d4a017",
    devotional:  "#e8820c",
    ecstatic:    "#ffd700",
    surrendered: "#66bb9a",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
            Step 3
          </p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
            Scene Breakdown
          </h2>
          <p className="text-sm mt-1" style={{ color: "oklch(0.60 0.015 68)" }}>
            Each lyric line becomes one visual scene. Run Director Analysis to apply cinematic shot vocabulary.
          </p>
        </div>
        {project.scenes.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.80 0.12 78)", border: "1px solid oklch(0.72 0.12 75 / 0.3)" }}>
              {project.scenes.length} scenes
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "oklch(0.18 0.016 52)", color: "oklch(0.60 0.012 65)", border: "1px solid oklch(0.28 0.025 58)" }}>
              ~{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} total
            </span>
          </div>
        )}
      </div>

      {/* Cinematic Style Sheet — shown after Director Analysis */}
      {project.cinematicStyle && (
        <div className="shrine-panel p-4 space-y-2">
          <button
            onClick={() => setShowStyleSheet(!showStyleSheet)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Clapperboard size={14} style={{ color: "oklch(0.72 0.12 75)" }} />
              <span className="text-sm font-semibold" style={{ color: "oklch(0.80 0.12 78)", fontFamily: "'Cinzel', serif" }}>
                Cinematic Style Sheet
              </span>
            </div>
            <span className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
              {showStyleSheet ? "▼" : "▶"}
            </span>
          </button>
          {showStyleSheet && (
            <div className="space-y-2 pt-1">
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.65 0.10 75)" }}>Color Palette</p>
                <p className="text-xs" style={{ color: "oklch(0.70 0.015 68)" }}>{project.cinematicStyle.colorPalette}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.65 0.10 75)" }}>Lighting Style</p>
                <p className="text-xs" style={{ color: "oklch(0.70 0.015 68)" }}>{project.cinematicStyle.lightingStyle}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.65 0.10 75)" }}>Mood Arc</p>
                <p className="text-xs" style={{ color: "oklch(0.70 0.015 68)" }}>{project.cinematicStyle.moodArc}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emotional Arc Visualization */}
      {hasDirectorData && (
        <div className="shrine-panel p-4 space-y-2">
          <p className="text-xs font-semibold" style={{ color: "oklch(0.65 0.10 75)", fontFamily: "'Cinzel', serif" }}>
            Emotional Arc
          </p>
          <div className="flex gap-0.5 rounded overflow-hidden" style={{ height: "8px" }}>
            {project.scenes.map((scene) => {
              const color = scene.emotionalWeight ? arcColors[scene.emotionalWeight] : "#333";
              return (
                <div
                  key={scene.id}
                  style={{ flex: 1, background: color, opacity: 0.8, transition: "background 300ms" }}
                  title={scene.emotionalWeight || ""}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {(Object.keys(WEIGHT_CONFIG) as EmotionalWeight[]).map((w) => {
              const count = project.scenes.filter((s) => s.emotionalWeight === w).length;
              if (!count) return null;
              return (
                <div key={w} className="flex items-center gap-1 text-xs">
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: arcColors[w] }} />
                  <span style={{ color: "oklch(0.55 0.012 65)" }}>{WEIGHT_CONFIG[w].label} ({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls panel */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.17 0.014 52)", border: "1px solid oklch(0.28 0.025 58)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* Row 1: LLM Model */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: "oklch(0.55 0.012 65)", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "72px" }}>
            LLM Model
          </span>
          <select
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
            className="flex-1"
            style={{
              padding: "0.4rem 0.75rem",
              background: "oklch(0.13 0.012 52)",
              border: "1px solid oklch(0.30 0.025 58)",
              borderRadius: "0.5rem",
              color: "oklch(0.80 0.12 78)",
              fontSize: "0.8rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <optgroup label="Gemini (platform key)">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash — fast · default</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro — most capable</option>
            </optgroup>
            <optgroup label="Gemini (own Gemini key)">
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.0-flash-thinking-exp">Gemini 2.0 Flash Thinking</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </optgroup>
            <optgroup label="ChatGPT (own OpenAI key)">
              <option value="gpt-4o">GPT-4o — powerful</option>
              <option value="gpt-4o-mini">GPT-4o Mini — fast · cheap</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </optgroup>
            <optgroup label="Claude (own Anthropic key)">
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku — fast · excellent</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet — best quality</option>
            </optgroup>
            <optgroup label="Groq / Llama (own Groq key — free)">
              <option value="llama-3.1-8b-instant">Llama 3.1 8B — ultra-fast · free</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B — quality · free</option>
              <option value="qwen-2.5-7b-instruct">Qwen 2.5 7B — multilingual · free</option>
            </optgroup>
            <optgroup label="Mistral (own Mistral key — free)">
              <option value="mistral-small-latest">Mistral Small — multilingual · free</option>
            </optgroup>
          </select>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "oklch(0.25 0.020 55)" }} />

        {/* Row 2: Primary + secondary actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary actions */}
          <button
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
              color: "oklch(0.12 0.015 55)",
              fontFamily: "'Cinzel', serif",
            }}
          >
            <Wand2 size={14} className={isGenerating ? "animate-spin" : ""} />
            {isGenerating ? "Generating…" : "Auto-Generate Scenes"}
          </button>

          {project.scenes.length > 0 && (
            <button
              onClick={handleDirectorAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: isAnalyzing ? "oklch(0.22 0.018 52)" : "linear-gradient(135deg, oklch(0.55 0.10 270), oklch(0.45 0.12 280))",
                color: isAnalyzing ? "oklch(0.55 0.012 65)" : "#fff",
              }}
              title="Analyze emotional arc and apply professional shot vocabulary (WS/MS/CU/ECU)"
            >
              <Clapperboard size={14} className={isAnalyzing ? "animate-pulse" : ""} />
              {isAnalyzing ? "Analyzing…" : hasDirectorData ? "Re-Analyze" : "Director Analysis"}
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Secondary actions */}
          {canUndoScenes && (
            <button
              onClick={() => { undoScenes(); toast.success("Restored previous scenes"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ background: "oklch(0.20 0.04 35)", color: "oklch(0.72 0.12 55)", border: "1px solid oklch(0.35 0.07 45)" }}
            >
              <Undo2 size={13} />
              Undo
            </button>
          )}
          <button
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
            style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
          >
            <Plus size={13} />
            Add Scene
          </button>
        </div>
      </div>

      {/* Director notes toggle */}
      {hasDirectorData && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDirectorNotes(!showDirectorNotes)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{
              background: showDirectorNotes ? "oklch(0.55 0.10 270 / 0.15)" : "oklch(0.22 0.018 52)",
              color: showDirectorNotes ? "oklch(0.75 0.10 270)" : "oklch(0.55 0.012 65)",
              border: `1px solid ${showDirectorNotes ? "oklch(0.55 0.10 270 / 0.4)" : "oklch(0.28 0.025 58)"}`,
            }}
          >
            <Info size={10} />
            {showDirectorNotes ? "Hide" : "Show"} Director Notes
          </button>
        </div>
      )}

      {/* Stats */}
      {project.scenes.length > 0 && (
        <div className="flex gap-4 text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
          <span style={{ color: "oklch(0.72 0.12 75)" }}>{project.scenes.length} scenes</span>
          <span>~{totalDuration}s total</span>
          <span>~{Math.round(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} video length</span>
          {hasDirectorData && (
            <span style={{ color: "oklch(0.65 0.10 270)" }}>✓ Director analyzed</span>
          )}
        </div>
      )}

      {/* Scene List */}
      {project.scenes.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ border: "2px dashed oklch(0.28 0.025 58)", color: "oklch(0.45 0.010 60)" }}
        >
          <Wand2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No scenes yet — click "Auto-Generate" to create scenes from your lyrics</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
          {project.scenes.map((scene, idx) => {
            const weightConfig = scene.emotionalWeight ? WEIGHT_CONFIG[scene.emotionalWeight] : null;
            const shotConfig = scene.shotType ? SHOT_CONFIG[scene.shotType] : null;
            const moveConfig = scene.cameraMovement ? MOVE_CONFIG[scene.cameraMovement] : null;

            return (
              <div key={scene.id} className="shrine-panel p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* Director badges row */}
                    {(weightConfig || shotConfig || moveConfig) && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {weightConfig && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: weightConfig.bg, color: weightConfig.color, border: `1px solid ${weightConfig.color}40` }}
                          >
                            {weightConfig.label}
                          </span>
                        )}
                        {shotConfig && (
                          <span
                            className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                            style={{ background: "oklch(0.55 0.10 270 / 0.15)", color: "oklch(0.75 0.10 270)", border: "1px solid oklch(0.55 0.10 270 / 0.3)" }}
                            title={shotConfig.label}
                          >
                            {shotConfig.abbr}
                          </span>
                        )}
                        {moveConfig && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: "oklch(0.18 0.016 52)", color: "oklch(0.55 0.012 65)", border: "1px solid oklch(0.28 0.025 58)" }}
                          >
                            {moveConfig.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Director note */}
                    {showDirectorNotes && scene.directorNote && (
                      <p
                        className="text-xs italic"
                        style={{
                          color: "oklch(0.60 0.08 270)",
                          borderLeft: "2px solid oklch(0.55 0.10 270 / 0.4)",
                          paddingLeft: "0.5rem",
                        }}
                      >
                        {scene.directorNote}
                      </p>
                    )}

                    {/* Lyric line */}
                    <div>
                      <p className="text-xs mb-1" style={{ color: "oklch(0.50 0.012 65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lyric</p>
                      <textarea
                        value={scene.lyricLine}
                        onChange={(e) => handleUpdateScene(scene.id, "lyricLine", e.target.value)}
                        placeholder="Lyric line..."
                        rows={2}
                        className="telugu-text w-full text-sm"
                        style={{
                          padding: "0.5rem 0.625rem",
                          background: "oklch(0.15 0.012 52)",
                          border: "1px solid oklch(0.30 0.025 58)",
                          borderRadius: "0.375rem",
                          color: "#fff",
                          resize: "vertical",
                          outline: "none",
                          lineHeight: "1.6",
                          fontFamily: "'Noto Sans Telugu', 'Inter', sans-serif",
                          width: "100%",
                        }}
                      />
                    </div>
                    {/* Scene description — full width */}
                    <div>
                      <p className="text-xs mb-1" style={{ color: "oklch(0.55 0.10 270)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Scene description</p>
                      <textarea
                        value={scene.sceneDescription}
                        onChange={(e) => handleUpdateScene(scene.id, "sceneDescription", e.target.value)}
                        placeholder="What the camera sees..."
                        rows={2}
                        className="w-full text-xs"
                        style={{
                          padding: "0.5rem 0.625rem",
                          background: "oklch(0.15 0.012 52)",
                          border: "1px solid oklch(0.28 0.025 58)",
                          borderRadius: "0.375rem",
                          color: "oklch(0.80 0.012 68)",
                          resize: "vertical",
                          outline: "none",
                          lineHeight: "1.5",
                          width: "100%",
                        }}
                      />
                    </div>
                    {/* Image prompt — full width */}
                    <div>
                      <p className="text-xs mb-1" style={{ color: "oklch(0.72 0.12 75)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Image prompt</p>
                      <textarea
                        value={scene.imagePrompt}
                        onChange={(e) => handleUpdateScene(scene.id, "imagePrompt", e.target.value)}
                        placeholder="AI image generator prompt..."
                        rows={3}
                        className="w-full text-xs"
                        style={{
                          padding: "0.5rem 0.625rem",
                          background: "oklch(0.13 0.014 60)",
                          border: "1px solid oklch(0.72 0.12 75 / 0.3)",
                          borderRadius: "0.375rem",
                          color: "oklch(0.82 0.10 78)",
                          resize: "vertical",
                          outline: "none",
                          lineHeight: "1.5",
                          width: "100%",
                        }}
                      />
                    </div>
                    {/* Duration row */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>Duration:</span>
                      <select
                        value={scene.duration}
                        onChange={(e) => handleUpdateScene(scene.id, "duration", Number(e.target.value))}
                        style={{
                          appearance: "none",
                          WebkitAppearance: "none",
                          padding: "0.25rem 0.5rem",
                          background: "oklch(0.16 0.016 52)",
                          border: "1px solid oklch(0.28 0.025 58)",
                          borderRadius: "0.375rem",
                          color: "oklch(0.72 0.12 75)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          outline: "none",
                          width: "58px",
                          textAlign: "center",
                        }}
                      >
                        {[3, 4, 5, 6, 7, 8, 10].map((d) => (
                          <option key={d} value={d} style={{ background: "oklch(0.18 0.016 52)" }}>
                            {d}s
                          </option>
                          ))}
                        </select>
                      </div>
                  </div>
                  <button
                    onClick={() => handleDeleteScene(scene.id)}
                    className="flex-shrink-0 p-1.5 rounded transition-colors hover:bg-red-500/10"
                    style={{ color: "oklch(0.45 0.010 60)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={project.scenes.length === 0}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
          color: "oklch(0.12 0.015 55)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        Continue to Image Prompts
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
