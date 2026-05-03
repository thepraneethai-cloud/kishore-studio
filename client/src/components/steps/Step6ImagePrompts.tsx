// ============================================================
// DESIGN: "Digital Sanctum" — Step 6: Bulk Image Prompts
// The biggest time-saver: generate all image prompts at once
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES } from "@/lib/studioData";
import { ChevronRight, Copy, Check, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

const STYLE_SUFFIXES = [
  "Tanjore painting style, gold leaf details",
  "Cinematic photography, 8K ultra-detailed",
  "Digital art, sacred geometry, divine glow",
  "Oil painting, Renaissance devotional art style",
  "Photorealistic, golden hour lighting",
];

const NEGATIVE_PROMPT = "no text, no watermarks, no modern elements, no people in casual clothes, no cars, no phones, no ugly artifacts";

export default function Step6ImagePrompts() {
  const { project, setScenes, setActiveStep, markStepComplete } = useProject();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [showNegative, setShowNegative] = useState(false);

  const deity = DEITIES.find((d) => d.key === project.deity);

  const buildImagePrompt = (sceneDesc: string) => {
    const styleSuffix = STYLE_SUFFIXES[selectedStyle];
    return `${sceneDesc}. ${styleSuffix}, warm amber and gold lighting from oil lamps, incense smoke, South Indian temple architecture, intricate stone carvings, sacred and divine atmosphere, ultra-detailed, high quality`;
  };

  const handleRegenerateAll = () => {
    const updated = project.scenes.map((scene) => ({
      ...scene,
      imagePrompt: buildImagePrompt(scene.sceneDescription),
    }));
    setScenes(updated);
    toast.success("All image prompts regenerated with new style!");
  };

  const handleCopyOne = (id: number, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Prompt copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allPrompts = project.scenes
      .map((s, i) => `Scene ${i + 1}: ${s.lyricLine}\n${s.imagePrompt}\n\nNegative: ${NEGATIVE_PROMPT}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    toast.success(`Copied all ${project.scenes.length} image prompts!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Scene #", "Lyric Line", "Image Prompt", "Negative Prompt"],
      ...project.scenes.map((s, i) => [
        String(i + 1),
        s.lyricLine,
        buildImagePrompt(s.sceneDescription),
        NEGATIVE_PROMPT,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "devotional-video"}-image-prompts.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  const handleUpdatePrompt = (id: number, value: string) => {
    setScenes(project.scenes.map((s) => (s.id === id ? { ...s, imagePrompt: value } : s)));
  };

  const handleContinue = () => {
    markStepComplete(5);
    setActiveStep(6);
  };

  if (project.scenes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>Step 5</p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>Image Prompts</h2>
        </div>
        <div className="text-center py-12 rounded-lg" style={{ border: "2px dashed oklch(0.28 0.025 58)", color: "oklch(0.45 0.010 60)" }}>
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please complete Step 4 (Scene Breakdown) first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 5
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          Image Prompts — Bulk Generator
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          All {project.scenes.length} image prompts generated. Copy individually or export all at once for batch generation.
        </p>
      </div>

      {/* Style selector + actions */}
      <div className="shrine-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
            Visual Style
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerateAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
            >
              <Sparkles size={11} />
              Regenerate All
            </button>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                background: copiedAll ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.22 0.018 52)",
                color: copiedAll ? "oklch(0.72 0.12 75)" : "oklch(0.65 0.015 68)",
                border: `1px solid ${copiedAll ? "oklch(0.72 0.12 75 / 0.5)" : "oklch(0.28 0.025 58)"}`,
              }}
            >
              {copiedAll ? <Check size={11} /> : <Copy size={11} />}
              {copiedAll ? "Copied All!" : "Copy All"}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
            >
              <Download size={11} />
              CSV
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLE_SUFFIXES.map((style, i) => (
            <button
              key={i}
              onClick={() => setSelectedStyle(i)}
              className="text-xs px-2.5 py-1.5 rounded transition-all"
              style={{
                background: selectedStyle === i ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.20 0.016 52)",
                border: selectedStyle === i ? "1px solid oklch(0.72 0.12 75 / 0.6)" : "1px solid oklch(0.25 0.020 55)",
                color: selectedStyle === i ? "oklch(0.80 0.12 78)" : "oklch(0.55 0.012 65)",
              }}
            >
              {style.split(",")[0]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNegative(!showNegative)}
            className="text-xs"
            style={{ color: "oklch(0.50 0.012 65)" }}
          >
            {showNegative ? "▼" : "▶"} Negative prompt
          </button>
          {showNegative && (
            <span className="text-xs" style={{ color: "oklch(0.45 0.010 60)" }}>
              {NEGATIVE_PROMPT}
            </span>
          )}
        </div>
      </div>

      {/* Prompt list */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {project.scenes.map((scene, idx) => (
          <div key={scene.id} className="shrine-panel p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}
                >
                  {idx + 1}
                </span>
                <span
                  className="text-sm telugu-text truncate max-w-[280px]"
                  style={{ color: "oklch(0.75 0.015 70)" }}
                >
                  {scene.lyricLine || "Scene " + (idx + 1)}
                </span>
              </div>
              <button
                onClick={() => handleCopyOne(scene.id, buildImagePrompt(scene.sceneDescription))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors"
                style={{
                  background: copiedId === scene.id ? "oklch(0.72 0.12 75 / 0.15)" : "oklch(0.22 0.018 52)",
                  color: copiedId === scene.id ? "oklch(0.72 0.12 75)" : "oklch(0.55 0.012 65)",
                  border: `1px solid ${copiedId === scene.id ? "oklch(0.72 0.12 75 / 0.4)" : "oklch(0.25 0.020 55)"}`,
                }}
              >
                {copiedId === scene.id ? <Check size={10} /> : <Copy size={10} />}
                {copiedId === scene.id ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              value={buildImagePrompt(scene.sceneDescription)}
              onChange={(e) => handleUpdatePrompt(scene.id, e.target.value)}
              className="sanctum-input text-xs"
              rows={2}
              style={{ padding: "0.375rem 0.625rem", resize: "none" }}
            />
          </div>
        ))}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
          color: "oklch(0.12 0.015 55)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        Continue to Video Prompts
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
