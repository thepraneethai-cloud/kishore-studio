// ============================================================
// SIDEBAR: Glassmorphism theme with vibrant accents
// Electric blue, neon pink, lime green
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import {
  Flame, Music, Mic2, Wand2, Film, Video, Scissors,
  Youtube, Sparkles, CheckCircle2, RotateCcw,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Select Deity", icon: Flame, short: "Deity" },
  { id: 2, label: "Write Lyrics", icon: Music, short: "Lyrics" },
  { id: 3, label: "Audio", icon: Mic2, short: "Audio" },
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
        padding: "0.75rem 0.5rem",
      }}>
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isDone = completedSteps.has(step.id);

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "8px",
                marginBottom: "0.25rem",
                textAlign: "left",
                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                border: "none",
                cursor: "pointer",
                background: isActive
                  ? "linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(255, 0, 110, 0.2))"
                  : "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                boxShadow: isActive ? "0 0 20px rgba(0, 212, 255, 0.3)" : "none",
                borderLeft: isActive ? "3px solid #00d4ff" : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.borderLeftColor = "#00d4ff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderLeftColor = "transparent";
                }
              }}
            >
              {/* Step number / check */}
              <div style={{
                flexShrink: 0,
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
              }}>
                {isDone && !isActive ? (
                  <CheckCircle2
                    size={16}
                    style={{ color: "#39ff14" }}
                  />
                ) : isActive ? (
                  <Icon size={15} style={{ color: "#00d4ff" }} />
                ) : (
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? "600" : "500",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: isActive
                    ? "#00d4ff"
                    : isDone
                    ? "#39ff14"
                    : "rgba(255, 255, 255, 0.8)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Progress indicator */}
      <div style={{
        padding: "1rem",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}>
          <span style={{
            fontSize: "0.75rem",
            color: "rgba(255, 255, 255, 0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: "600",
          }}>
            Progress
          </span>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: "700",
            color: "#00d4ff",
          }}>
            {completedSteps.size}/{STEPS.length}
          </span>
        </div>
        <div
          style={{
            height: "6px",
            borderRadius: "3px",
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "3px",
              transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1)",
              width: `${(completedSteps.size / STEPS.length) * 100}%`,
              background: "linear-gradient(90deg, #00d4ff, #ff006e, #39ff14)",
            }}
          />
        </div>

        <button
          onClick={resetProject}
          style={{
            marginTop: "0.75rem",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            padding: "0.625rem",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "rgba(255, 255, 255, 0.6)",
            cursor: "pointer",
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            fontFamily: "'Inter', sans-serif",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
            e.currentTarget.style.color = "#00d4ff";
            e.currentTarget.style.borderColor = "#00d4ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <RotateCcw size={12} />
          New Project
        </button>
      </div>
    </aside>
  );
}
