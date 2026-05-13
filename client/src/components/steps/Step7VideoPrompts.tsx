// ============================================================
// DESIGN: "Digital Sanctum" — Step 5: Video Motion Prompts
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { ChevronRight, Copy, Check, Download, Video, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);

  const buildMotionPrompt = (sceneDesc: string) => {
    const template = MOTION_TYPES[selectedMotion].template;
    // Incorporate Master Prompt guidance into video motion
    const masterPromptGuidance = project.masterPrompt
      ? `[Master Vision: ${project.masterPrompt}] `
      : "";
    return `${masterPromptGuidance}${template.replace("{scene}", sceneDesc)}`;
  };

  const handleCopyOne = (id: number, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Motion prompt copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allPrompts = displayScenes
      .map((s, i) => `Scene ${i + 1}: ${s.lyricLine}\nMOTION: ${buildMotionPrompt(s.sceneDescription)}\nDURATION: ${s.duration}s`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    toast.success(`Copied ${displayScenes.length} motion prompts!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Scene #", "Lyric Line", "Duration (s)", "Motion Prompt"],
      ...displayScenes.map((s, i) => [
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

  const approvedScenes = project.scenes.filter((s) => s.imageApproved === true);
  const displayScenes = approvedScenes.length > 0 ? approvedScenes : project.scenes;
  const totalDuration = displayScenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
            Step 7
          </p>
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
            Video Motion Prompts
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Generate motion prompts for Runway, Pika, Kling, or similar tools. Master Prompt guides thematic consistency.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "oklch(0.65 0.14 65 / 0.15)", color: "oklch(0.72 0.14 68)", border: "1px solid oklch(0.65 0.14 65 / 0.3)" }}
          >
            {displayScenes.length}{approvedScenes.length > 0 ? " approved" : ""} scenes
          </span>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "oklch(0.55 0.10 250 / 0.15)", color: "oklch(0.70 0.10 250)", border: "1px solid oklch(0.55 0.10 250 / 0.3)" }}
          >
            ~{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} total
          </span>
        </div>
      </div>

      {/* Master Prompt Reference Panel */}
      {project.masterPrompt && (
        <div className="shrine-panel p-4 space-y-3">
          <button
            onClick={() => setShowMasterPrompt(!showMasterPrompt)}
            className="flex items-center justify-between w-full text-left"
          >
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
              📋 Master Creative Vision (Reference)
            </p>
            {showMasterPrompt ? (
              <ChevronUp size={16} style={{ color: "oklch(0.65 0.14 65)" }} />
            ) : (
              <ChevronDown size={16} style={{ color: "oklch(0.65 0.14 65)" }} />
            )}
          </button>
          {showMasterPrompt && (
            <div
              className="text-xs leading-relaxed p-3 rounded"
              style={{
                background: "oklch(0.14 0.016 52)",
                color: "oklch(0.70 0.015 68)",
                border: "1px solid oklch(0.24 0.020 55)",
              }}
            >
              {project.masterPrompt}
            </div>
          )}
        </div>
      )}

      {/* Controls card */}
      <div className="rounded-xl space-y-3 p-4" style={{ background: "oklch(0.17 0.014 52)", border: "1px solid oklch(0.28 0.025 58)" }}>
        {/* Motion type */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0.012 65)" }}>
            Motion Type
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTION_TYPES.map((mt, i) => (
              <button
                key={mt.id}
                onClick={() => setSelectedMotion(i)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: selectedMotion === i ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.20 0.016 52)",
                  border: selectedMotion === i ? "1px solid oklch(0.72 0.12 75 / 0.6)" : "1px solid oklch(0.25 0.020 55)",
                  color: selectedMotion === i ? "oklch(0.82 0.12 78)" : "oklch(0.55 0.012 65)",
                }}
              >
                {mt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template preview */}
        <p className="text-xs leading-relaxed px-3 py-2 rounded-lg" style={{ color: "oklch(0.50 0.010 62)", background: "oklch(0.14 0.012 50)", border: "1px solid oklch(0.22 0.018 52)" }}>
          <span style={{ color: "oklch(0.45 0.008 60)" }}>Template: </span>
          {MOTION_TYPES[selectedMotion].template.replace("{scene}", "[scene description]")}
        </p>

        {/* Divider */}
        <div style={{ height: "1px", background: "oklch(0.25 0.020 55)" }} />

        {/* Actions row */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: copiedAll ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.22 0.018 52)",
              color: copiedAll ? "oklch(0.82 0.12 78)" : "oklch(0.65 0.015 68)",
              border: `1px solid ${copiedAll ? "oklch(0.72 0.12 75 / 0.5)" : "oklch(0.30 0.025 58)"}`,
            }}
          >
            {copiedAll ? <Check size={12} /> : <Copy size={12} />}
            {copiedAll ? "Copied!" : "Copy All"}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.30 0.025 58)" }}
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Approved-only notice */}
      {approvedScenes.length > 0 && approvedScenes.length < project.scenes.length && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: "oklch(0.18 0.08 145 / 0.3)", color: "oklch(0.65 0.15 145)", border: "1px solid oklch(0.45 0.12 145 / 0.3)" }}>
          ✓ Showing video prompts for {approvedScenes.length} approved scenes only ({project.scenes.length - approvedScenes.length} rejected scenes skipped)
        </div>
      )}

      {/* Prompt list */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {displayScenes.map((scene, idx) => (
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
