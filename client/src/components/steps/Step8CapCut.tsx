// ============================================================
// DESIGN: "Digital Sanctum" — Step 8: CapCut Assembly Guide
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { ChevronRight, CheckCircle2, ExternalLink } from "lucide-react";

const ASSEMBLY_STEPS = [
  {
    phase: "Setup",
    steps: [
      "Create a new CapCut project (1920×1080, 30fps)",
      "Import your final MP3 audio file as the base track",
      "Set the timeline length to match your audio duration",
    ],
  },
  {
    phase: "Import Clips",
    steps: [
      "Import all generated video clips in order (Scene 1, 2, 3...)",
      "Place each clip on the timeline aligned to the corresponding lyric",
      "Use the waveform view to align clips with musical beats",
    ],
  },
  {
    phase: "Transitions",
    steps: [
      "Add 'Dissolve' or 'Fade' transitions between clips (0.5–1s)",
      "Use 'Dip to Black' for major section changes (Pallavi → Charanam)",
      "Avoid harsh cuts — devotional content needs smooth flow",
    ],
  },
  {
    phase: "Effects",
    steps: [
      "Add a subtle warm color grade (increase warmth/orange tones)",
      "Apply a slight vignette to all clips for cinematic feel",
      "Add golden particle overlay on key moments (Pallavi, climax)",
      "Use slow-motion (0.7x) on close-up deity shots",
    ],
  },
  {
    phase: "Text & Subtitles",
    steps: [
      "Add Telugu lyrics as subtitles (Noto Sans Telugu font, white with shadow)",
      "Add song title at the start (5 seconds, fade in/out)",
      "Add deity name and channel name at the end (outro card)",
    ],
  },
  {
    phase: "Export",
    steps: [
      "Export at 4K (3840×2160) if possible, otherwise 1080p",
      "Use H.264 codec, 60fps for smooth motion",
      "Audio: AAC, 320kbps",
      "File name: [DeityName]-[SongTitle]-4K.mp4",
    ],
  },
];

const CAPCUT_EFFECTS = [
  { name: "Warm Glow", use: "On deity close-up shots" },
  { name: "Light Leak", use: "At section transitions" },
  { name: "Particle Dust", use: "Throughout the video" },
  { name: "Soft Focus", use: "On background elements" },
  { name: "Golden Bokeh", use: "On lamp and fire scenes" },
  { name: "Smoke Overlay", use: "On incense/ritual scenes" },
];

export default function Step8CapCut() {
  const { project, setActiveStep, markStepComplete } = useProject();

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  const handleContinue = () => {
    markStepComplete(8);
    setActiveStep(9);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 8
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          CapCut Assembly Guide
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          Assemble your {project.scenes.length} clips with the audio track. Estimated video length: ~{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")}.
        </p>
      </div>

      {/* CapCut link */}
      <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ background: "oklch(0.72 0.12 75 / 0.08)", border: "1px solid oklch(0.72 0.12 75 / 0.25)" }}
      >
        <p className="text-sm" style={{ color: "oklch(0.75 0.015 70)" }}>
          Open CapCut to start assembling your video
        </p>
        <a
          href="https://www.capcut.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-semibold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
            color: "oklch(0.12 0.015 55)",
            fontFamily: "'Cinzel', serif",
          }}
        >
          CapCut <ExternalLink size={11} />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Assembly steps — 2 cols */}
        <div className="col-span-2 space-y-3">
          {ASSEMBLY_STEPS.map((phase) => (
            <div key={phase.phase} className="shrine-panel p-3 space-y-2">
              <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
                {phase.phase}
              </p>
              <ul className="space-y-1.5">
                {phase.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "oklch(0.60 0.015 68)" }}>
                    <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.14 65)" }} />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Effects panel — 1 col */}
        <div className="space-y-3">
          <div className="shrine-panel p-3 space-y-3">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
              Recommended Effects
            </p>
            {CAPCUT_EFFECTS.map((effect) => (
              <div key={effect.name}>
                <p className="text-xs font-medium" style={{ color: "oklch(0.75 0.015 70)" }}>{effect.name}</p>
                <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>{effect.use}</p>
              </div>
            ))}
          </div>

          <div className="shrine-panel p-3 space-y-2">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
              Color Grade
            </p>
            <div className="space-y-1.5 text-xs" style={{ color: "oklch(0.60 0.015 68)" }}>
              <div className="flex justify-between">
                <span>Warmth</span><span style={{ color: "oklch(0.72 0.12 75)" }}>+20</span>
              </div>
              <div className="flex justify-between">
                <span>Saturation</span><span style={{ color: "oklch(0.72 0.12 75)" }}>+10</span>
              </div>
              <div className="flex justify-between">
                <span>Contrast</span><span style={{ color: "oklch(0.72 0.12 75)" }}>+5</span>
              </div>
              <div className="flex justify-between">
                <span>Shadows</span><span style={{ color: "oklch(0.72 0.12 75)" }}>-10</span>
              </div>
              <div className="flex justify-between">
                <span>Highlights</span><span style={{ color: "oklch(0.72 0.12 75)" }}>+5</span>
              </div>
            </div>
          </div>
        </div>
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
        Continue to YouTube Export
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
