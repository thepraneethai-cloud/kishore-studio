// ============================================================
// DESIGN: "Digital Sanctum" — fixed left sidebar workflow navigator
// Gold/amber accents, Cinzel font for step labels
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { cn } from "@/lib/utils";
import {
  Flame, Music, Mic2, Wand2, Film, Video, Scissors,
  Youtube, Sparkles, CheckCircle2, Circle, RotateCcw,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Select Deity", icon: Flame, short: "Deity" },
  { id: 2, label: "Write Lyrics", icon: Music, short: "Lyrics" },
  { id: 3, label: "SUNO Style", icon: Mic2, short: "Style" },
  { id: 4, label: "Music Prompt", icon: Wand2, short: "Music" },
  { id: 5, label: "Scene Breakdown", icon: Film, short: "Scenes" },
  { id: 6, label: "Image Prompts", icon: Sparkles, short: "Images" },
  { id: 7, label: "Video Prompts", icon: Video, short: "Video" },
  { id: 8, label: "CapCut Assembly", icon: Scissors, short: "Edit" },
  { id: 9, label: "YouTube Export", icon: Youtube, short: "Export" },
];

export default function Sidebar() {
  const { activeStep, setActiveStep, completedSteps, project, resetProject } = useProject();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-40"
      style={{
        background: "oklch(0.11 0.016 52)",
        borderRight: "1px solid oklch(0.22 0.022 55)",
      }}
    >
      {/* Logo / Brand */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid oklch(0.22 0.022 55)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.12 0.015 55)" }}
          >
            🕉
          </div>
          <span
            className="text-sm font-semibold tracking-wide cinzel"
            style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}
          >
            Studio
          </span>
        </div>
        <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
          Telugu Devotional
        </p>
        {project.deity && (
          <p
            className="text-xs mt-1 truncate"
            style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Noto Sans Telugu', sans-serif" }}
          >
            {project.title || "New Project"}
          </p>
        )}
      </div>

      {/* Step Navigator */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isDone = completedSteps.has(step.id);

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 text-left transition-all duration-200 group",
                isActive
                  ? "text-[oklch(0.12_0.015_55)]"
                  : "hover:bg-[oklch(0.20_0.016_52)]"
              )}
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
                      boxShadow: "0 2px 12px oklch(0.72 0.12 75 / 0.3)",
                    }
                  : {}
              }
            >
              {/* Step number / check */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone && !isActive ? (
                  <CheckCircle2
                    size={16}
                    style={{ color: "oklch(0.72 0.12 75)" }}
                  />
                ) : isActive ? (
                  <Icon size={15} />
                ) : (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.50 0.012 65)", fontFamily: "'Cinzel', serif" }}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className="text-sm font-medium truncate"
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  color: isActive
                    ? "oklch(0.12 0.015 55)"
                    : isDone
                    ? "oklch(0.75 0.015 70)"
                    : "oklch(0.65 0.015 68)",
                }}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Progress indicator */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid oklch(0.22 0.022 55)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
            Progress
          </span>
          <span className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
            {completedSteps.size}/{STEPS.length}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "oklch(0.22 0.018 52)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedSteps.size / STEPS.length) * 100}%`,
              background: "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
            }}
          />
        </div>

        <button
          onClick={resetProject}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded transition-colors hover:bg-[oklch(0.20_0.016_52)]"
          style={{ color: "oklch(0.45 0.010 60)" }}
        >
          <RotateCcw size={11} />
          New Project
        </button>
      </div>
    </aside>
  );
}
