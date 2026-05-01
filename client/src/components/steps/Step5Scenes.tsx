// ============================================================
// DESIGN: "Digital Sanctum" — Step 5: Scene Breakdown Generator
// Auto-generates scenes from lyrics, each lyric → one visual
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, Scene } from "@/lib/studioData";
import { ChevronRight, Wand2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

// Scene suggestion templates per deity
const SCENE_TEMPLATES: Record<string, { keywords: string[]; description: string }[]> = {
  venkateswara: [
    { keywords: ["govinda", "గోవింద"], description: "Thousands of devotees chanting Govinda with hands raised, golden temple gopuram in background" },
    { keywords: ["alipiri", "అలిపిరి", "మెట్లు"], description: "Stone steps of Alipiri covered with barefoot pilgrims, lush green hills, misty morning" },
    { keywords: ["deepam", "దీపం", "lamp"], description: "Row of brass oil lamps (diyas) burning in temple corridor, golden light reflecting on black granite floor" },
    { keywords: ["tirumala", "తిరుమల", "hills", "కొండ"], description: "Aerial view of Tirumala seven hills at sunrise, golden mist, temple visible at peak" },
    { keywords: ["darshan", "దర్శన"], description: "Close-up of golden idol of Venkateswara with flower garlands, divine glow, incense smoke" },
    { keywords: ["prasad", "ప్రసాద", "laddu"], description: "Tirupati laddu prasad being distributed, golden light, devotees receiving with folded hands" },
    { keywords: ["pushkarini", "పుష్కరిణి"], description: "Sacred Swami Pushkarini lake at dawn, lotus flowers, temple reflection in still water" },
    { keywords: ["bell", "గంట", "nadaswaram"], description: "Temple bells ringing, nadaswaram musicians playing, flower petals falling from above" },
  ],
  ganesha: [
    { keywords: ["ganapati", "గణపతి", "ganesha"], description: "Magnificent Ganesha idol with golden crown, surrounded by marigold flowers and diyas" },
    { keywords: ["modak", "మోదక"], description: "Plate of modak sweets offered to Ganesha, golden light, incense smoke curling upward" },
    { keywords: ["mushika", "mouse", "వాహన"], description: "Ganesha's mouse vehicle at his feet, tiny and humble, surrounded by flowers" },
    { keywords: ["lotus", "కమలం"], description: "Pink lotus flowers floating on sacred water, morning light, temple bells in background" },
    { keywords: ["procession", "శోభాయాత్ర"], description: "Colorful Ganesh procession through streets, drums, flowers, joyful devotees" },
    { keywords: ["tusk", "దంత"], description: "Close-up of Ganesha's broken tusk, symbolic and sacred, golden ornaments" },
  ],
  lakshmi: [
    { keywords: ["lotus", "కమలం", "padma"], description: "Goddess Lakshmi seated on pink lotus, golden light, white elephants on either side" },
    { keywords: ["gold", "బంగారు", "coins"], description: "Gold coins flowing from Lakshmi's hands, abundance and prosperity, warm golden light" },
    { keywords: ["elephant", "ఏనుగు"], description: "Two white elephants performing abhishek with water trunks, sacred and majestic" },
    { keywords: ["diya", "దీప", "lamp"], description: "Rows of lit diyas in a dark room, warm amber glow, flower petals scattered" },
    { keywords: ["saree", "వస్త్రం", "red"], description: "Red silk saree with golden border, divine feminine grace, temple setting" },
    { keywords: ["prosperity", "సంపద", "wealth"], description: "Overflowing pot of gold and jewels, lotus flowers, divine abundance" },
  ],
  shiva: [
    { keywords: ["kailash", "కైలాస"], description: "Snow-capped Mount Kailash at dawn, divine golden light, mystical clouds" },
    { keywords: ["nataraja", "నటరాజ"], description: "Shiva as Nataraja in cosmic dance, ring of fire, divine energy" },
    { keywords: ["lingam", "లింగం"], description: "Shiva lingam with milk abhishek, flowers, bilva leaves, sacred atmosphere" },
    { keywords: ["ganga", "గంగ"], description: "Sacred Ganga river flowing from Shiva's matted hair, moonlit night" },
    { keywords: ["trishul", "త్రిశూల"], description: "Shiva's trident glowing with divine energy, mountains in background" },
    { keywords: ["nandi", "నంది"], description: "White Nandi bull facing Shiva lingam, sacred and devoted, temple setting" },
    { keywords: ["moon", "చంద్రుడు", "crescent"], description: "Crescent moon in Shiva's hair, night sky, stars, divine glow" },
    { keywords: ["ash", "భస్మం", "bhasma"], description: "Sacred ash (vibhuti) being applied, three horizontal lines, divine ritual" },
  ],
};

function generateScenesFromLyrics(lyrics: string, deityKey: string): Scene[] {
  const lines = lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("[") && l.length > 3);

  const templates = SCENE_TEMPLATES[deityKey] || [];

  return lines.slice(0, 32).map((line, i) => {
    // Try to match a template
    const lowerLine = line.toLowerCase();
    const matched = templates.find((t) =>
      t.keywords.some((k) => lowerLine.includes(k.toLowerCase()))
    );

    const sceneDesc = matched
      ? matched.description
      : `Devotional scene for: "${line}" — temple interior with warm lamp light, incense smoke, stone carvings`;

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

export default function Step5Scenes() {
  const { project, setScenes, setActiveStep, markStepComplete } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const deity = DEITIES.find((d) => d.key === project.deity);

  const handleAutoGenerate = () => {
    if (!project.lyrics.trim()) {
      toast.error("Please write lyrics in Step 2 first");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const scenes = generateScenesFromLyrics(project.lyrics, project.deity || "venkateswara");
      setScenes(scenes);
      setIsGenerating(false);
      toast.success(`Generated ${scenes.length} scenes from your lyrics!`);
    }, 800);
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now(),
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
    markStepComplete(5);
    setActiveStep(6);
  };

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 5
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          Scene Breakdown
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          Map each lyric line to a visual scene. Auto-generate all scenes from your lyrics in one click.
        </p>
      </div>

      {/* Auto-generate bar */}
      <div
        className="flex items-center justify-between p-4 rounded-lg"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75 / 0.08), oklch(0.65 0.14 65 / 0.08))",
          border: "1px solid oklch(0.72 0.12 75 / 0.25)",
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.80 0.12 78)", fontFamily: "'Cinzel', serif" }}>
            Auto-Generate All Scenes
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
            Analyzes your lyrics and creates scene descriptions + image prompts for every line
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
              color: "oklch(0.12 0.015 55)",
              fontFamily: "'Cinzel', serif",
            }}
          >
            <Wand2 size={14} className={isGenerating ? "animate-spin" : ""} />
            {isGenerating ? "Generating..." : "Auto-Generate"}
          </button>
          <button
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
            style={{
              background: "oklch(0.22 0.018 52)",
              color: "oklch(0.65 0.015 68)",
              border: "1px solid oklch(0.28 0.025 58)",
            }}
          >
            <Plus size={14} />
            Add Scene
          </button>
        </div>
      </div>

      {/* Stats */}
      {project.scenes.length > 0 && (
        <div className="flex gap-4 text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
          <span style={{ color: "oklch(0.72 0.12 75)" }}>{project.scenes.length} scenes</span>
          <span>~{totalDuration}s total</span>
          <span>~{Math.round(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} video length</span>
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
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {project.scenes.map((scene, idx) => (
            <div
              key={scene.id}
              className="shrine-panel p-3 space-y-2"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  {/* Lyric line */}
                  <input
                    type="text"
                    value={scene.lyricLine}
                    onChange={(e) => handleUpdateScene(scene.id, "lyricLine", e.target.value)}
                    placeholder="Lyric line..."
                    className="sanctum-input telugu-text text-sm"
                    style={{ padding: "0.375rem 0.625rem" }}
                  />
                  {/* Scene description */}
                  <input
                    type="text"
                    value={scene.sceneDescription}
                    onChange={(e) => handleUpdateScene(scene.id, "sceneDescription", e.target.value)}
                    placeholder="Scene description..."
                    className="sanctum-input text-xs"
                    style={{ padding: "0.375rem 0.625rem" }}
                  />
                  {/* Duration */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>Duration:</span>
                    <select
                      value={scene.duration}
                      onChange={(e) => handleUpdateScene(scene.id, "duration", Number(e.target.value))}
                      className="text-xs rounded px-2 py-1"
                      style={{
                        background: "oklch(0.16 0.016 52)",
                        border: "1px solid oklch(0.28 0.025 58)",
                        color: "oklch(0.70 0.015 68)",
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
          ))}
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
