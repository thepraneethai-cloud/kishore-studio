// ============================================================
// SIDEBAR: Glassmorphism theme with vibrant accents
// Electric blue, neon pink, lime green
// Mobile: slide-in drawer with backdrop tap-to-close
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import {
  Flame, Mic2, Film, Sparkles, Video, Scissors,
  Youtube, CheckCircle2, X, FolderOpen, Plus, Trash2,
} from "lucide-react";
import { useState } from "react";
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
    deleteProject,
    sessionTitle,
    loadProject,
    currentServerProjectId,
  } = useProject();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data: savedProjects = [], isLoading: projectsLoading, isError: projectsError } = trpc.projects.list.useQuery(undefined, {
    retry: 1,
  });

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    onClose?.();
  };

  const handleDeleteProject = async () => {
    if (!currentServerProjectId) return;
    const confirmed = window.confirm("Delete this project? This cannot be undone.");
    if (!confirmed) return;
    setDeletingId(currentServerProjectId);
    try {
      await deleteProject(currentServerProjectId);
      toast.success("Project deleted");
    } catch {
      toast.error("Could not delete project");
    } finally {
      setDeletingId(null);
    }
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
        /* When onClose is set the sidebar is a mobile fixed overlay;
           otherwise it's an in-flow desktop panel sized by its parent. */
        ...(onClose ? {
          position: "fixed" as const,
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: 40,
        } : {
          position: "relative" as const,
          height: "100%",
        }),
        width: "224px",
        display: "flex",
        flexDirection: "column",
        background: "#171717",
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
                background: "rgba(255,255,255,0.1)",
                color: "#ececf1",
                flexShrink: 0,
              }}
            >
              🕉
            </div>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#ececf1",
              }}
            >
              Studio
            </span>
          </div>
          <p style={{
            fontSize: "0.72rem",
            color: "rgba(236,236,241,0.45)",
          }}>
            Kishore's Studio
          </p>
          {sessionTitle && (
            <p
              style={{
                fontSize: "0.72rem",
                marginTop: "0.2rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "150px",
                color: "rgba(236,236,241,0.7)",
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
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <FolderOpen
              size={14}
              style={{
                position: "absolute",
                left: "0.65rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(236,236,241,0.4)",
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
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#ececf1",
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
          {currentServerProjectId && (
            <button
              onClick={() => void handleDeleteProject()}
              disabled={deletingId === currentServerProjectId}
              title="Delete this project"
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 60, 60, 0.35)",
                background: "rgba(255, 40, 40, 0.08)",
                color: deletingId === currentServerProjectId ? "rgba(255,100,100,0.4)" : "#ff4444",
                cursor: deletingId === currentServerProjectId ? "wait" : "pointer",
                transition: "all 150ms",
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
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
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                borderLeft: isActive ? "2px solid #ececf1" : "2px solid transparent",
                color: isActive ? "#ececf1" : "rgba(236,236,241,0.5)",
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
                      color: "#10a37f",
                      fill: "#10a37f",
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(236,236,241,0.3)", letterSpacing: "0.04em" }}>
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
          <span style={{ fontSize: "0.68rem", fontWeight: "600", color: "rgba(236,236,241,0.4)", letterSpacing: "0.06em" }}>
            PROGRESS
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(236,236,241,0.7)" }}>
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
              background: "#10a37f",
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
            background: "rgba(255,255,255,0.06)",
            color: "rgba(236,236,241,0.7)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontWeight: "500",
            fontSize: "0.78rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 200ms",
          }}
        >
          <Plus size={14} />
          New project
        </button>
      </div>
    </aside>
  );
}
