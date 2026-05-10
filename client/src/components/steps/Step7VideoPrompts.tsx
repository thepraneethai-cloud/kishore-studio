// ============================================================
// DESIGN: "Digital Sanctum" — Step 5: Video Motion Prompts
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { ChevronRight, Copy, Check, Download, Video } from "lucide-react";
import { toast } from "sonner";

const MOTION_TYPES = [
  { id: "push", label: "Slow Push-In", template: "Slow camera push-in (0.3x zoom over 6 seconds), {scene}, soft particle glow on light sources, subtle smoke drift, lamp flames flickering, smooth meditative motion" },
  { id: "pan", label: "Gentle Pan", template: "Slow horizontal pan left-to-right (0.2x speed), {scene}, warm light rays shifting, incense smoke drifting, sacred atmosphere" },
  { id: "zoom", label: "Ken Burns Zoom", template: "Ken Burns effect: slow zoom from wide to close-up (0.4x over 8 seconds), {scene}, depth of field blur, golden bokeh particles" },
  { id: "static", label: "Static + Particles", template: "Static shot with animated elements: {scene}, floating golden light particles, flickering lamp flames, smoke wisps, subtle shimmer effect" },
  { id: "orbit", label: "Orbital Rotate", template: "Slow orbital camera rotation (0.1x speed), {scene}, divine glow pulsing, light rays sweeping, ethereal atmosphere" },
];

export default function Step7VideoPrompts() {
  const { project, setScenes, setActiveStep, markStepComplete } = useProject();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedMotion, setSelectedMotion] = useState(0);

  const buildMotionPrompt = (sceneDesc: string) => {
    const template = MOTION_TYPES[selectedMotion].template;
    return template.replace("{scene}", sceneDesc);
  };

  const handleCopyOne = (id: number, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Motion prompt copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allPrompts = project.scenes
      .map((s, i) => `Scene ${i + 1}: ${s.lyricLine}\nMOTION: ${buildMotionPrompt(s.sceneDescription)}\nDURATION: ${s.duration}s`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    toast.success(`Copied all ${project.scenes.length} motion prompts!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Scene #", "Lyric Line", "Duration (s)", "Motion Prompt"],
      ...project.scenes.map((s, i) => [
        String(i + 1),
        s.lyricLine,
        String(s.duration),
        buildMotionPrompt(s.sceneDescription),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "devotional-video"}-motion-prompts.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
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
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>Video Prompts</h2>
        </div>
        <div className="text-center py-12 rounded-lg" style={{ border: "2px dashed oklch(0.28 0.025 58)", color: "oklch(0.45 0.010 60)" }}>
          <Video size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please complete Step 3 (Scene Breakdown) first</p>
        </div>
      </div>
    );
  }

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 5
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          Video Motion Prompts
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          Generate motion prompts for Grok Photo→Video, Runway, or similar tools. {project.scenes.length} scenes · ~{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} total.
        </p>
      </div>

      {/* Motion type selector */}
      <div className="shrine-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
            Motion Type
          </p>
          <div className="flex gap-2">
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
          {MOTION_TYPES.map((mt, i) => (
            <button
              key={mt.id}
              onClick={() => setSelectedMotion(i)}
              className="text-xs px-3 py-1.5 rounded transition-all"
              style={{
                background: selectedMotion === i ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.20 0.016 52)",
                border: selectedMotion === i ? "1px solid oklch(0.72 0.12 75 / 0.6)" : "1px solid oklch(0.25 0.020 55)",
                color: selectedMotion === i ? "oklch(0.80 0.12 78)" : "oklch(0.55 0.012 65)",
              }}
            >
              {mt.label}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: "oklch(0.45 0.010 60)" }}>
          Template: {MOTION_TYPES[selectedMotion].template.replace("{scene}", "[scene description]")}
        </p>
      </div>

      {/* Prompt list */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {project.scenes.map((scene, idx) => (
          <div key={scene.id} className="shrine-panel p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "oklch(0.65 0.14 65 / 0.15)", color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}
                >
                  {idx + 1}
                </span>
                <span className="text-xs telugu-text truncate max-w-[240px]" style={{ color: "oklch(0.65 0.015 68)" }}>
                  {scene.lyricLine || "Scene " + (idx + 1)}
                </span>
                <span className="text-xs" style={{ color: "oklch(0.45 0.010 60)" }}>
                  {scene.duration}s
                </span>
              </div>
              <button
                onClick={() => handleCopyOne(scene.id, buildMotionPrompt(scene.sceneDescription))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors"
                style={{
                  background: copiedId === scene.id ? "oklch(0.65 0.14 65 / 0.15)" : "oklch(0.22 0.018 52)",
                  color: copiedId === scene.id ? "oklch(0.65 0.14 65)" : "oklch(0.55 0.012 65)",
                  border: `1px solid ${copiedId === scene.id ? "oklch(0.65 0.14 65 / 0.4)" : "oklch(0.25 0.020 55)"}`,
                }}
              >
                {copiedId === scene.id ? <Check size={10} /> : <Copy size={10} />}
                {copiedId === scene.id ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.015 68)" }}>
              {buildMotionPrompt(scene.sceneDescription)}
            </p>
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
        Continue to CapCut Assembly
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
