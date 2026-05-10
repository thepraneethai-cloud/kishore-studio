// ============================================================
// DESIGN: "Digital Sanctum" — project state management
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  Project,
  createEmptyProject,
  Scene,
  SunoStyle,
  DeityKey,
  CinematicStyle,
} from "@/lib/studioData";
import { trpc } from "@/lib/trpc";

interface ProjectContextType {
  project: Project;
  activeStep: number;
  setActiveStep: (step: number) => void;
  setDeity: (deity: DeityKey) => void;
  setTitle: (title: string) => void;
  sessionTitle: string | null; // set only in current browser session, never from localStorage
  setLyrics: (lyrics: string) => void;
  setSunoStyle: (style: Partial<SunoStyle>) => void;
  setScenes: (scenes: Scene[]) => void;
  updateScene: (id: number, updates: Partial<Scene>) => void;
  setYouTubeData: (data: Partial<Pick<Project, "youtubeTitle" | "youtubeDescription" | "youtubeTags" | "thumbnailPrompt">>) => void;
  setCharacterPrefix: (prefix: string) => void;
  setImageSeed: (seed: number | null) => void;
  setCinematicStyle: (style: CinematicStyle | null) => void;
  resetProject: () => void;
  completedSteps: Set<number>;
  markStepComplete: (step: number) => void;
  // Undo
  undoLyrics: () => void;
  undoScenes: () => void;
  canUndoLyrics: boolean;
  canUndoScenes: boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

const STORAGE_KEY = "telugu-studio-project";
const STEPS_KEY = "telugu-studio-steps";
const SERVER_ID_KEY = "telugu-studio-server-id";

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
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History stacks — kept in memory only, not persisted (volatile undo)
  const lyricsHistoryRef = useRef<string[]>([]);
  const scenesHistoryRef = useRef<Scene[][]>([]);
  const [canUndoLyrics, setCanUndoLyrics] = useState(false);
  const [canUndoScenes, setCanUndoScenes] = useState(false);

  const HISTORY_LIMIT = 5;

  const upsertProject = trpc.projects.upsert.useMutation({
    onSuccess: (data) => {
      if (data?.serverProjectId) {
        localStorage.setItem(SERVER_ID_KEY, String(data.serverProjectId));
      }
    },
    onError: (err) => {
      if (err.data?.code !== "UNAUTHORIZED") {
        console.error("[ProjectContext] Server save failed:", err.message);
      }
    },
  });

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(STEPS_KEY);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  // Persist project locally and to server — debounced so rapid keystrokes don't thrash storage
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, updatedAt: Date.now() }));

      const savedServerId = localStorage.getItem(SERVER_ID_KEY);
      upsertProject.mutate({
        serverProjectId: savedServerId ? Number(savedServerId) : undefined,
        title: project.title,
        deity: project.deity,
        lyrics: project.lyrics,
        sunoStyle: project.sunoStyle as unknown as Record<string, unknown>,
        scenes: project.scenes,
        youtubeTitle: project.youtubeTitle,
        youtubeDescription: project.youtubeDescription,
        youtubeTags: project.youtubeTags,
        thumbnailPrompt: project.thumbnailPrompt,
      });
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [project, upsertProject.mutate]);

  useEffect(() => {
    localStorage.setItem(STEPS_KEY, JSON.stringify(Array.from(completedSteps)));
  }, [completedSteps]);

  const setDeity = useCallback((deity: DeityKey) => {
    setProject((p) => ({ ...p, deity }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setProject((p) => ({ ...p, title }));
    setSessionTitle(title.trim() || null);
  }, []);

  const setLyrics = useCallback((lyrics: string) => {
    setProject((p) => {
      if (p.lyrics && p.lyrics !== lyrics) {
        lyricsHistoryRef.current = [p.lyrics, ...lyricsHistoryRef.current].slice(0, HISTORY_LIMIT);
        setCanUndoLyrics(true);
      }
      return { ...p, lyrics };
    });
  }, []);

  const undoLyrics = useCallback(() => {
    const prev = lyricsHistoryRef.current[0];
    if (!prev) return;
    lyricsHistoryRef.current = lyricsHistoryRef.current.slice(1);
    setCanUndoLyrics(lyricsHistoryRef.current.length > 0);
    setProject((p) => ({ ...p, lyrics: prev }));
  }, []);

  const setSunoStyle = useCallback((style: Partial<SunoStyle>) => {
    setProject((p) => ({ ...p, sunoStyle: { ...p.sunoStyle, ...style } }));
  }, []);

  const setScenes = useCallback((scenes: Scene[]) => {
    setProject((p) => {
      if (p.scenes.length > 0) {
        scenesHistoryRef.current = [p.scenes, ...scenesHistoryRef.current].slice(0, HISTORY_LIMIT);
        setCanUndoScenes(true);
      }
      return { ...p, scenes };
    });
  }, []);

  const undoScenes = useCallback(() => {
    const prev = scenesHistoryRef.current[0];
    if (!prev) return;
    scenesHistoryRef.current = scenesHistoryRef.current.slice(1);
    setCanUndoScenes(scenesHistoryRef.current.length > 0);
    setProject((p) => ({ ...p, scenes: prev }));
  }, []);

  const updateScene = useCallback((id: number, updates: Partial<Scene>) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const setCharacterPrefix = useCallback((prefix: string) => {
    setProject((p) => ({ ...p, characterPrefix: prefix }));
  }, []);

  const setImageSeed = useCallback((seed: number | null) => {
    setProject((p) => ({ ...p, imageSeed: seed }));
  }, []);

  const setCinematicStyle = useCallback((style: CinematicStyle | null) => {
    setProject((p) => ({ ...p, cinematicStyle: style }));
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
    setSessionTitle(null);
    lyricsHistoryRef.current = [];
    scenesHistoryRef.current = [];
    setCanUndoLyrics(false);
    setCanUndoScenes(false);
    localStorage.removeItem(SERVER_ID_KEY);
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
        sessionTitle,
        setLyrics,
        setSunoStyle,
        setScenes,
        updateScene,
        setYouTubeData,
        setCharacterPrefix,
        setImageSeed,
        setCinematicStyle,
        resetProject,
        completedSteps,
        markStepComplete,
        undoLyrics,
        undoScenes,
        canUndoLyrics,
        canUndoScenes,
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
