// ============================================================
// SIDEBAR: Glassmorphism theme with vibrant accents
// Electric blue, neon pink, lime green
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import {
  Flame, Music, Mic2, Film, Sparkles, Video, Scissors,
  Youtube, CheckCircle2, RotateCcw,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Select Deity", icon: Flame, short: "Deity" },
  { id: 2, label: "Write Lyrics", icon: Music, short: "Lyrics" },
  { id: 3, label: "Audio", icon: Mic2, short: "Audio" },
  { id: 4, label: "Scene Breakdown", icon: Film, short: "Scenes" },
  { id: 5, label: "Image Prompts", icon: Sparkles, short: "Images" },
  { id: 6, label: "Video Prompts", icon: Video, short: "Video" },
  { id: 7, label: "CapCut Assembly", icon: Scissors, short: "Edit" },
  { id: 8, label: "YouTube Export", icon: Youtube, short: "Export" },
];

export default function Sidebar() {
  const { activeStep, setActiveStep, completedSteps, project, resetProject } = useProject();

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: "224px",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        background: "rgba(10, 10, 20, 0.9)",
        backdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Logo / Brand */}
      <div style={{
        padding: "1.25rem 1rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #00d4ff, #00f0ff)",
              color: "#000",
            }}
          >
            🕉
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              letterSpacing: "0.05em",
              color: "#00d4ff",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Studio
          </span>
        </div>
        <p style={{
          fontSize: "0.75rem",
          color: "rgba(255, 255, 255, 0.6)",
        }}>
          Kishore's Studio
        </p>
        {project.deity && (
          <p
            style={{
              fontSize: "0.75rem",
              marginTop: "0.25rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "#ff006e",
              fontWeight: "500",
            }}
          >
            {project.title || "New Project"}
          </p>
        )}
      </div>

      {/* Step Navigator */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem 0",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}>
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isCompleted = completedSteps.has(step.id);
          
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                background: isActive 
                  ? "linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(255, 0, 110, 0.1))"
                  : "transparent",
                border: isActive ? "1px solid rgba(0, 212, 255, 0.3)" : "none",
                borderLeft: isActive ? "3px solid #00d4ff" : "3px solid transparent",
                color: isActive ? "#00d4ff" : "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                transition: "all 200ms",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "500",
                textAlign: "left",
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} />
                {isCompleted && (
                  <CheckCircle2 
                    size={12} 
                    style={{ 
                      position: "absolute", 
                      right: "-4px", 
                      bottom: "-4px",
                      color: "#39ff14",
                      fill: "#39ff14",
                    }} 
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)" }}>
                  STEP {step.id} OF 8
                </div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {step.label}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Progress Bar */}
      <div style={{ padding: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)" }}>
            PROGRESS
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#00d4ff" }}>
            {completedSteps.size}/8
          </span>
        </div>
        <div style={{
          height: "4px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #00d4ff, #ff006e)",
              width: `${(completedSteps.size / 8) * 100}%`,
              transition: "width 300ms ease-out",
            }}
          />
        </div>
      </div>

      {/* New Project Button */}
      <div style={{ padding: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <button
          onClick={resetProject}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            background: "rgba(255, 0, 110, 0.1)",
            color: "#ff006e",
            border: "1px solid rgba(255, 0, 110, 0.3)",
            fontWeight: "600",
            fontSize: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 200ms",
          }}
        >
          <RotateCcw size={14} />
          NEW PROJECT
        </button>
      </div>
    </aside>
  );
}
