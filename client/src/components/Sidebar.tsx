// ============================================================
// SIDEBAR: Glassmorphism theme with vibrant accents
// Electric blue, neon pink, lime green
// Mobile: slide-in drawer with backdrop tap-to-close
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import {
  Flame, Mic2, Film, Sparkles, Video, Scissors,
  Youtube, CheckCircle2, X, FolderOpen, Plus,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Concept & Lyrics", icon: Flame, short: "Lyrics" },
  { id: 2, label: "Audio", icon: Mic2, short: "Audio" },
  { id: 3, label: "Scene Breakdown", icon: Film, short: "Scenes" },
  { id: 4, label: "Image Prompts", icon: Sparkles, short: "Images" },
  { id: 5, label: "Video Prompts", icon: Video, short: "Video" },
  { id: 6, label: "CapCut Assembly", icon: Scissors, short: "Edit" },
  { id: 7, label: "YouTube Export", icon: Youtube, short: "Export" },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const {
    activeStep,
    setActiveStep,
    completedSteps,
    resetProject,
    sessionTitle,
    loadProject,
    currentServerProjectId,
  } = useProject();
  const { data: savedProjects = [], isLoading: projectsLoading, isError: projectsError } = trpc.projects.list.useQuery(undefined, {
    retry: 1,
  });

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    onClose?.();
  };

  const handleProjectSelect = async (value: string) => {
    if (value === "new") {
      resetProject();
      onClose?.();
      toast.success("Started a new project");
      return;
    }
    const id = Number(value);
    if (!id || id === currentServerProjectId) return;
    try {
      await loadProject(id);
      onClose?.();
      toast.success("Project loaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load project");
    }
  };

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
        background: "rgba(10, 10, 20, 0.97)",
        backdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Logo / Brand */}
      <div style={{
        padding: "1.25rem 1rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "0.5rem",
      }}>
        <div>
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
                flexShrink: 0,
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
          {sessionTitle && (
            <p
              style={{
                fontSize: "0.75rem",
                marginTop: "0.25rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "150px",
                color: "#ff006e",
                fontWeight: "500",
              }}
            >
              {sessionTitle}
            </p>
          )}
        </div>

        {/* Close button — only visible when onClose is provided (mobile) */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "transparent",
              color: "rgba(255, 255, 255, 0.6)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Project Picker */}
      <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.08em",
            marginBottom: "0.4rem",
          }}
        >
          PROJECT
        </label>
        <div style={{ position: "relative" }}>
          <FolderOpen
            size={14}
            style={{
              position: "absolute",
              left: "0.65rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#00d4ff",
              pointerEvents: "none",
            }}
          />
          <select
            value={currentServerProjectId ?? "new"}
            onChange={(e) => void handleProjectSelect(e.target.value)}
            disabled={projectsLoading || projectsError}
            style={{
              width: "100%",
              padding: "0.65rem 0.6rem 0.65rem 2rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(0, 212, 255, 0.22)",
              background: "rgba(4, 8, 24, 0.86)",
              color: "#00d4ff",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: projectsLoading ? "wait" : projectsError ? "not-allowed" : "pointer",
              outline: "none",
            }}
          >
            <option value="new">
              {projectsLoading ? "Loading projects..." : projectsError ? "Saved projects unavailable" : "New unsaved project"}
            </option>
            {savedProjects.map((saved) => (
              <option key={saved.id} value={saved.id}>
                {saved.name || "Untitled"}
              </option>
            ))}
          </select>
        </div>
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
              onClick={() => handleStepClick(step.id)}
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
                  STEP {step.id} OF 7
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
            {completedSteps.size}/7
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
              width: `${(completedSteps.size / 7) * 100}%`,
              transition: "width 300ms ease-out",
            }}
          />
        </div>
      </div>

      {/* New Project Button */}
      <div style={{ padding: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <button
          onClick={() => {
            resetProject();
            onClose?.();
            toast.success("Started a new project");
          }}
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
          <Plus size={14} />
          NEW PROJECT
        </button>
      </div>
    </aside>
  );
}
