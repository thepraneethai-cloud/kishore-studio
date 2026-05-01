// ============================================================
// DESIGN: "Digital Sanctum" — project state management
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Project,
  createEmptyProject,
  Scene,
  SunoStyle,
  DeityKey,
} from "@/lib/studioData";

interface ProjectContextType {
  project: Project;
  activeStep: number;
  setActiveStep: (step: number) => void;
  setDeity: (deity: DeityKey) => void;
  setTitle: (title: string) => void;
  setLyrics: (lyrics: string) => void;
  setSunoStyle: (style: Partial<SunoStyle>) => void;
  setScenes: (scenes: Scene[]) => void;
  updateScene: (id: number, updates: Partial<Scene>) => void;
  setYouTubeData: (data: Partial<Pick<Project, "youtubeTitle" | "youtubeDescription" | "youtubeTags" | "thumbnailPrompt">>) => void;
  resetProject: () => void;
  completedSteps: Set<number>;
  markStepComplete: (step: number) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

const STORAGE_KEY = "telugu-studio-project";
const STEPS_KEY = "telugu-studio-steps";

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : createEmptyProject();
    } catch {
      return createEmptyProject();
    }
  });

  const [activeStep, setActiveStep] = useState(1);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(STEPS_KEY);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  // Persist project to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, updatedAt: Date.now() }));
  }, [project]);

  useEffect(() => {
    localStorage.setItem(STEPS_KEY, JSON.stringify(Array.from(completedSteps)));
  }, [completedSteps]);

  const setDeity = useCallback((deity: DeityKey) => {
    setProject((p) => ({ ...p, deity }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setProject((p) => ({ ...p, title }));
  }, []);

  const setLyrics = useCallback((lyrics: string) => {
    setProject((p) => ({ ...p, lyrics }));
  }, []);

  const setSunoStyle = useCallback((style: Partial<SunoStyle>) => {
    setProject((p) => ({ ...p, sunoStyle: { ...p.sunoStyle, ...style } }));
  }, []);

  const setScenes = useCallback((scenes: Scene[]) => {
    setProject((p) => ({ ...p, scenes }));
  }, []);

  const updateScene = useCallback((id: number, updates: Partial<Scene>) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const setYouTubeData = useCallback(
    (data: Partial<Pick<Project, "youtubeTitle" | "youtubeDescription" | "youtubeTags" | "thumbnailPrompt">>) => {
      setProject((p) => ({ ...p, ...data }));
    },
    []
  );

  const resetProject = useCallback(() => {
    setProject(createEmptyProject());
    setCompletedSteps(new Set());
    setActiveStep(1);
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set<number>(Array.from(prev).concat(step)));
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        project,
        activeStep,
        setActiveStep,
        setDeity,
        setTitle,
        setLyrics,
        setSunoStyle,
        setScenes,
        updateScene,
        setYouTubeData,
        resetProject,
        completedSteps,
        markStepComplete,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
