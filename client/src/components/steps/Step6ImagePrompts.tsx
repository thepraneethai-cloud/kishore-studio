// ============================================================
// DESIGN: "Digital Sanctum" — Step 6: Bulk Image Prompts
// Providers: Flux Dev (Replicate) | DALL-E 3 / GPT-image-1 (OpenAI)
// Character Consistency: shared style prefix + seed locking
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, getDefaultCharacterPrefix } from "@/lib/studioData";
import { ChevronRight, Copy, Check, Download, Sparkles, Image, Loader2, AlertCircle, Settings, Shuffle, Lock, Unlock, Zap, ThumbsUp, ThumbsDown, Link, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

type ImageProvider = "flux" | "dalle";
type FluxModel = "flux-dev" | "flux-schnell";
type DalleModel = "dall-e-3" | "gpt-image-1";

const STYLE_SUFFIXES = [
  "Tanjore painting style, gold leaf details",
  "Cinematic photography, 8K ultra-detailed",
  "Digital art, sacred geometry, divine glow",
  "Oil painting, Renaissance devotional art style",
  "Photorealistic, golden hour lighting",
];

const NEGATIVE_PROMPT = "no text, no watermarks, no modern elements, no people in casual clothes, no cars, no phones, no ugly artifacts";

interface ImageJob {
  jobId: string;
  sceneIdx: number;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  imageUrl?: string;
  error?: string;
}

export default function Step6ImagePrompts() {
  const { project, setScenes, updateScene, setActiveStep, markStepComplete, setCharacterPrefix, setImageSeed } = useProject();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [showNegative, setShowNegative] = useState(false);
  const [seedLocked, setSeedLocked] = useState(project.imageSeed !== null);

  // Provider selection
  const [provider, setProvider] = useState<ImageProvider>("flux");
  const [fluxModel, setFluxModel] = useState<FluxModel>("flux-dev");
  const [dalleModel, setDalleModel] = useState<DalleModel>("dall-e-3");
  const [dalleQuality, setDalleQuality] = useState<"standard" | "hd">("standard");
  const [dalleStyle, setDalleStyle] = useState<"natural" | "vivid">("natural");

  // Generation state
  const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
  const [genStatus, setGenStatus] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [isPolling, setIsPolling] = useState(false);
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);

  const utils = trpc.useUtils();
  const deity = DEITIES.find((d) => d.key === project.deity);

  // Auto-populate character prefix when deity is first selected and prefix is empty
  useEffect(() => {
    if (deity && !project.characterPrefix) {
      setCharacterPrefix(getDefaultCharacterPrefix(deity));
    }
  }, [deity, project.characterPrefix, setCharacterPrefix]);

  // Fetch user settings (both Replicate and OpenAI keys)
  const { data: userSettings } = trpc.settings.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const replicateApiKey = userSettings?.replicateApiKey || "";
  const openaiApiKey = userSettings?.openaiApiKey || "";

  // Derived: which key is needed for selected provider
  const activeApiKey = provider === "dalle" ? openaiApiKey : replicateApiKey;
  const missingKeyRoute = "/settings";

  const generateImagesMutation = trpc.generation.generateImages.useMutation();

  const buildImagePrompt = useCallback((sceneDesc: string) => {
    const styleSuffix = STYLE_SUFFIXES[selectedStyle];
    // Incorporate Master Prompt guidance into image generation
    const masterPromptGuidance = project.masterPrompt
      ? `Guided by: ${project.masterPrompt}. `
      : "";
    return `${masterPromptGuidance}${sceneDesc}. ${styleSuffix}, warm amber and gold lighting from oil lamps, incense smoke, South Indian temple architecture, intricate stone carvings, sacred and divine atmosphere, ultra-detailed, high quality`;
  }, [selectedStyle, project.masterPrompt]);

  // Polling loop — re-runs whenever imageJobs changes while isPolling is true
  useEffect(() => {
    if (!isPolling || imageJobs.length === 0) return;

    const pending = imageJobs.filter(
      (j) => j.status === "starting" || j.status === "processing"
    );
    if (pending.length === 0) {
      setIsPolling(false);
      setGenStatus("done");
      const succeeded = imageJobs.filter((j) => j.status === "succeeded").length;
      toast.success(`${succeeded}/${imageJobs.length} images ready!`);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await utils.generation.pollJobs.fetch({
          jobIds: pending.map((j) => j.jobId),
          replicateApiKey,
        });

        if (!result.success || !result.data) return;

        setImageJobs((prev) =>
          prev.map((job) => {
            const updated = result.data!.find((r) => r.id === job.jobId);
            if (!updated) return job;
            const rawOutput = updated.output;
            const imageUrl = Array.isArray(rawOutput) ? rawOutput[0] : (rawOutput as string | undefined);
            // Auto-save URL to scene when job succeeds
            if (updated.status === "succeeded" && imageUrl) {
              const scene = project.scenes[job.sceneIdx];
              if (scene) updateScene(scene.id, { imageUrl });
            }
            return {
              ...job,
              status: updated.status as ImageJob["status"],
              imageUrl: imageUrl || job.imageUrl,
              error: updated.error,
            };
          })
        );
      } catch (err) {
        console.error("[Step6] Polling error:", err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPolling, imageJobs, replicateApiKey, utils]);

  const handleGenerateImages = async () => {
    if (!activeApiKey) {
      toast.error(
        provider === "dalle"
          ? "Add your OpenAI API key in Settings first"
          : "Add your Replicate API key in Settings first"
      );
      return;
    }

    setGenStatus("submitting");
    setImageJobs([]);

    try {
      const prompts = project.scenes.map((s) =>
        s.imagePrompt || buildImagePrompt(s.sceneDescription)
      );

      const mutationInput =
        provider === "dalle"
          ? {
              prompts,
              provider: "dalle" as const,
              openaiApiKey,
              dalleModel,
              dalleQuality,
              dalleStyle,
              stylePrefix: project.characterPrefix || undefined,
            }
          : {
              prompts,
              provider: "flux" as const,
              replicateApiKey,
              model: fluxModel,
              width: 1024,
              height: 576,
              stylePrefix: project.characterPrefix || undefined,
              seed: project.imageSeed ?? undefined,
            };

      const result = await generateImagesMutation.mutateAsync(mutationInput);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Generation failed to start");
      }

      const jobs: ImageJob[] = result.data.map((job, idx) => ({
        jobId: job.id,
        sceneIdx: idx,
        status: job.status as ImageJob["status"],
        imageUrl: Array.isArray(job.output) ? job.output[0] : (job.output as string | undefined),
      }));

      // For DALL-E, save image URLs immediately (results come back in one shot)
      jobs.forEach((job) => {
        if (job.status === "succeeded" && job.imageUrl) {
          const scene = project.scenes[job.sceneIdx];
          if (scene) updateScene(scene.id, { imageUrl: job.imageUrl });
        }
      });

      setImageJobs(jobs);

      // DALL-E returns completed results immediately — no polling needed
      if (provider === "dalle") {
        setGenStatus("done");
        const succeeded = jobs.filter((j) => j.status === "succeeded").length;
        toast.success(`${succeeded}/${jobs.length} images generated via ${dalleModel}!`);
      } else {
        setGenStatus("polling");
        setIsPolling(true);
        toast.success(`Generating ${prompts.length} images via ${fluxModel === "flux-schnell" ? "Flux Schnell" : "Flux Dev"}...`);
      }
    } catch (error) {
      setGenStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to start generation");
    }
  };

  const handleRegenerateAll = () => {
    const updated = project.scenes.map((scene) => ({
      ...scene,
      imagePrompt: buildImagePrompt(scene.sceneDescription || scene.imagePrompt),
    }));
    setScenes(updated);
    toast.success("All image prompts regenerated with new style!");
  };

  const handleCopyOne = (id: number, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Prompt copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allPrompts = project.scenes
      .map((s, i) => `Scene ${i + 1}: ${s.lyricLine}\n${s.imagePrompt}\n\nNegative: ${NEGATIVE_PROMPT}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    toast.success(`Copied all ${project.scenes.length} image prompts!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Scene #", "Lyric Line", "Image Prompt", "Negative Prompt"],
      ...project.scenes.map((s, i) => [
        String(i + 1),
        s.lyricLine,
        buildImagePrompt(s.sceneDescription),
        NEGATIVE_PROMPT,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "devotional-video"}-image-prompts.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  const handleUpdatePrompt = (id: number, value: string) => {
    setScenes(project.scenes.map((s) => (s.id === id ? { ...s, imagePrompt: value } : s)));
  };

  const handleRandomSeed = () => {
    const seed = Math.floor(Math.random() * 2_147_483_647);
    setImageSeed(seed);
    setSeedLocked(true);
    toast.success(`Seed locked: ${seed}`);
  };

  const handleToggleSeedLock = () => {
    if (seedLocked) {
      setImageSeed(null);
      setSeedLocked(false);
    } else {
      handleRandomSeed();
    }
  };

  const handleContinue = () => {
    markStepComplete(4);
    setActiveStep(5);
  };

  const pendingCount = imageJobs.filter((j) => j.status === "starting" || j.status === "processing").length;
  const doneCount = imageJobs.filter((j) => j.status === "succeeded").length;
  const [uploadingSceneId, setUploadingSceneId] = useState<number | null>(null);

  const handleFileUpload = async (sceneId: number, file: File) => {
    setUploadingSceneId(sceneId);
    try {
      const res = await fetch(
        file.type.startsWith("video/") ? "/api/upload/video" : "/api/upload/image",
        { method: "POST", headers: { "Content-Type": file.type }, body: file },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Upload failed");
        return;
      }
      const { url } = await res.json();
      updateScene(sceneId, { imageUrl: url });
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed — check network");
    } finally {
      setUploadingSceneId(null);
    }
  };

  const approvedCount = project.scenes.filter((s) => s.imageApproved === true).length;
  const rejectedCount = project.scenes.filter((s) => s.imageApproved === false).length;
  const reviewedCount = approvedCount + rejectedCount;
  const scenesWithImages = project.scenes.filter((s) => s.imageUrl).length;

  const panelStyle = {
    background: "rgba(12,18,48,0.72)",
    border: "1px solid rgba(0,212,255,0.16)",
    borderRadius: "0.75rem",
    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
  } as const;

  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "0.4rem",
  } as const;

  const fieldStyle = {
    width: "100%",
    padding: "0.75rem",
    background: "rgba(4,8,24,0.82)",
    border: "1px solid rgba(0,212,255,0.18)",
    borderRadius: "0.5rem",
    color: "rgba(255,255,255,0.88)",
    fontSize: "0.875rem",
    outline: "none",
  } as const;

  const selectStyle = {
    ...fieldStyle,
    color: "#00d4ff",
    fontWeight: 600,
    cursor: "pointer",
  } as const;

  if (project.scenes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>Step 6</p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>Image Prompts</h2>
        </div>
        <div className="text-center py-12 rounded-lg" style={{ border: "2px dashed oklch(0.28 0.025 58)", color: "oklch(0.45 0.010 60)" }}>
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please complete Step 3 (Scene Breakdown) first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
            Step 4
          </p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
            Image Prompts
          </h2>
          <p className="text-sm mt-1" style={{ color: "oklch(0.60 0.015 68)" }}>
            Generate images in-app or copy prompts for Leonardo AI / Midjourney. Master Prompt guides visual consistency.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.80 0.12 78)", border: "1px solid oklch(0.72 0.12 75 / 0.3)" }}>
            {project.scenes.length} scenes
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

      {/* Controls card — Style + Seed + Actions */}
      <div className="space-y-4 p-4" style={panelStyle}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#00d4ff" }}>
            Image setup
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
            Choose style, provider, model, and consistency settings before generating.
          </p>
        </div>

        {/* Style Lock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0.012 65)" }}>
              Style Lock
            </span>
            {deity && (
              <button
                onClick={() => setCharacterPrefix(getDefaultCharacterPrefix(deity))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors"
                style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
              >
                <Sparkles size={9} />
                Reset to {deity.name} default
              </button>
            )}
          </div>
          <textarea
            value={project.characterPrefix}
            onChange={(e) => setCharacterPrefix(e.target.value)}
            placeholder="Tanjore painting style, gold leaf, South Indian temple art, consistent character design…"
            rows={2}
            style={{
              width: "100%",
              padding: "0.5rem 0.625rem",
              background: fieldStyle.background,
              border: fieldStyle.border,
              borderRadius: fieldStyle.borderRadius,
              color: fieldStyle.color,
              fontSize: "0.78rem",
              lineHeight: "1.5",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        <div style={{ height: "1px", background: "oklch(0.25 0.020 55)" }} />

        {/* Art Style dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0.012 65)" }}>
              Art Style
            </span>
            <button
              onClick={() => setShowNegative(!showNegative)}
              className="text-xs"
              style={{ color: "oklch(0.45 0.010 60)" }}
            >
              {showNegative ? "▲" : "▼"} Negative prompt
            </button>
          </div>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(Number(e.target.value))}
            style={selectStyle}
          >
            {STYLE_SUFFIXES.map((style, i) => (
              <option key={style} value={i}>{style}</option>
            ))}
          </select>
          {showNegative && (
            <p className="text-xs leading-relaxed" style={{ color: "oklch(0.45 0.010 60)", fontStyle: "italic" }}>
              {NEGATIVE_PROMPT}
            </p>
          )}
        </div>

        <div style={{ height: "1px", background: "oklch(0.25 0.020 55)" }} />

        {/* Seed + Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Seed</span>
          <input
            type="number"
            value={project.imageSeed ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setImageSeed(v === "" ? null : Number(v));
              setSeedLocked(v !== "");
            }}
            placeholder="random"
            style={{
              padding: "0.3rem 0.5rem",
              background: fieldStyle.background,
              border: fieldStyle.border,
              borderRadius: "0.5rem",
              color: fieldStyle.color,
              fontSize: "0.78rem",
              outline: "none",
              width: "100px",
            }}
          />
          <button
            onClick={handleRandomSeed}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
            title="Roll a random seed"
          >
            <Shuffle size={10} />
            Random
          </button>
          <button
            onClick={handleToggleSeedLock}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{
              background: seedLocked ? "oklch(0.18 0.06 150 / 0.3)" : "oklch(0.22 0.018 52)",
              color: seedLocked ? "oklch(0.72 0.12 145)" : "oklch(0.50 0.012 65)",
              border: `1px solid ${seedLocked ? "oklch(0.50 0.12 145 / 0.5)" : "oklch(0.28 0.025 58)"}`,
            }}
            title={seedLocked ? "Unlock seed" : "Lock seed"}
          >
            {seedLocked ? <Lock size={10} /> : <Unlock size={10} />}
            {seedLocked ? "Locked" : "Unlocked"}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleRegenerateAll}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
          >
            <Sparkles size={11} />
            Restyle All
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: copiedAll ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.22 0.018 52)",
              color: copiedAll ? "oklch(0.72 0.12 75)" : "oklch(0.65 0.015 68)",
              border: `1px solid ${copiedAll ? "oklch(0.72 0.12 75 / 0.5)" : "oklch(0.28 0.025 58)"}`,
            }}
          >
            {copiedAll ? <Check size={11} /> : <Copy size={11} />}
            {copiedAll ? "Copied!" : "Copy All"}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
          >
            <Download size={11} />
            CSV
          </button>
        </div>
        {seedLocked && project.imageSeed !== null && (
          <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
            Seed <span style={{ color: "oklch(0.72 0.12 145)", fontFamily: "monospace" }}>{project.imageSeed}</span> locked — all {project.scenes.length} images will share the same visual style.
          </p>
        )}
      </div>

      {/* In-app Generation Panel */}
      <div className="p-4 space-y-4" style={panelStyle}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#00d4ff" }}>
            Generate in app
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
            Pick a provider and model. Required keys can be added in Settings.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value as ImageProvider)} style={selectStyle}>
              <option value="flux">Flux via Replicate</option>
              <option value="dalle">ChatGPT / OpenAI images</option>
            </select>
          </div>

          {provider === "flux" && (
            <div>
              <label style={labelStyle}>Model</label>
              <select value={fluxModel} onChange={(e) => setFluxModel(e.target.value as FluxModel)} style={selectStyle}>
                <option value="flux-dev">Flux Dev - best quality</option>
                <option value="flux-schnell">Flux Schnell - faster, cheaper</option>
              </select>
            </div>
          )}

          {provider === "dalle" && (
            <div>
              <label style={labelStyle}>Model</label>
              <select value={dalleModel} onChange={(e) => setDalleModel(e.target.value as DalleModel)} style={selectStyle}>
                <option value="dall-e-3">DALL-E 3</option>
                <option value="gpt-image-1">GPT-image-1</option>
              </select>
            </div>
          )}

          {provider === "dalle" && dalleModel === "dall-e-3" && (
            <>
              <div>
                <label style={labelStyle}>Quality</label>
                <select value={dalleQuality} onChange={(e) => setDalleQuality(e.target.value as "standard" | "hd")} style={selectStyle}>
                  <option value="standard">Standard - lower cost</option>
                  <option value="hd">HD - higher detail</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Rendering style</label>
                <select value={dalleStyle} onChange={(e) => setDalleStyle(e.target.value as "natural" | "vivid")} style={selectStyle}>
                  <option value="natural">Natural</option>
                  <option value="vivid">Vivid</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Flux model note */}
        {provider === "flux" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(4,8,24,0.45)", border: "1px solid rgba(0,212,255,0.10)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.48)" }}>
              {fluxModel === "flux-dev"
                ? "Flux Dev is better for final images. Use this when quality matters."
                : "Flux Schnell is faster and cheaper. Use this for drafts or quick tests."}
            </p>
          </div>
        )}

        {/* DALL-E specific note */}
        {provider === "dalle" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(4,8,24,0.45)", border: "1px solid rgba(0,212,255,0.10)" }}>
            <p className="w-full text-xs" style={{ color: "oklch(0.48 0.010 60)" }}>
              Note: DALL-E generates at 1792×1024 (16:9). Results return immediately — no polling needed.
              {dalleModel === "dall-e-3" && " Seed locking is not supported by DALL-E 3."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.80 0.12 78)", fontFamily: "'Cinzel', serif" }}>
              Generate in App
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.012 65)" }}>
              {provider === "dalle"
                ? `${dalleModel === "dall-e-3" ? "DALL-E 3" : "GPT-image-1"} via OpenAI — results ready in ~${Math.ceil(project.scenes.length / 3) * 5}s`
                : `Flux Dev via Replicate — ~$0.01/image${project.imageSeed !== null ? ` · seed ${project.imageSeed}` : ""}`}
            </p>
          </div>
          {!activeApiKey ? (
            <button
              onClick={() => navigate(missingKeyRoute)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.10 65)", border: "1px solid oklch(0.35 0.07 65)" }}
            >
              <Settings size={11} />
              {provider === "dalle" ? "Add OpenAI Key" : "Add Replicate Key"}
            </button>
          ) : (
            <button
              onClick={handleGenerateImages}
              disabled={genStatus === "submitting" || genStatus === "polling"}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded transition-all font-semibold"
              style={{
                background:
                  genStatus === "submitting" || genStatus === "polling"
                    ? "oklch(0.28 0.025 58)"
                    : "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
                color:
                  genStatus === "submitting" || genStatus === "polling"
                    ? "oklch(0.55 0.012 65)"
                    : "oklch(0.12 0.015 55)",
                border: "none",
                cursor: genStatus === "submitting" || genStatus === "polling" ? "not-allowed" : "pointer",
              }}
            >
              {genStatus === "submitting" ? (
                <><Loader2 size={12} className="animate-spin" /> {provider === "dalle" ? "Generating…" : "Starting…"}</>
              ) : genStatus === "polling" ? (
                <><Loader2 size={12} className="animate-spin" /> {doneCount}/{imageJobs.length} done</>
              ) : (
                <><Image size={12} /> Generate {project.scenes.length} Images</>
              )}
            </button>
          )}
        </div>

        {/* Generation progress bar */}
        {imageJobs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
              <span>{doneCount} generated · {pendingCount} pending · {imageJobs.filter(j => j.status === "failed").length} failed</span>
              {genStatus === "done" && <span style={{ color: "oklch(0.72 0.12 75)" }}>✓ Complete</span>}
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "oklch(0.22 0.018 52)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneCount / imageJobs.length) * 100}%`,
                  background: "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
                }}
              />
            </div>
          </div>
        )}

        {genStatus === "error" && (
          <div className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: "oklch(0.18 0.05 20)", color: "oklch(0.70 0.15 25)", border: "1px solid oklch(0.28 0.08 20)" }}>
            <AlertCircle size={12} />
            Generation failed. Check your Replicate API key and try again.
          </div>
        )}
      </div>

      {/* Prompt list */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {project.scenes.map((scene, idx) => {
          const job = imageJobs.find((j) => j.sceneIdx === idx);
          return (
            <div key={scene.id} className="shrine-panel p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="text-sm telugu-text truncate max-w-[240px]"
                    style={{ color: "oklch(0.75 0.015 70)" }}
                  >
                    {scene.lyricLine || "Scene " + (idx + 1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Job status badge */}
                  {job && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background:
                          job.status === "succeeded" ? "oklch(0.18 0.06 150)" :
                          job.status === "failed"    ? "oklch(0.18 0.05 20)"  :
                                                       "oklch(0.22 0.018 52)",
                        color:
                          job.status === "succeeded" ? "oklch(0.72 0.12 145)" :
                          job.status === "failed"    ? "oklch(0.70 0.15 25)"  :
                                                       "oklch(0.55 0.012 65)",
                        border: "1px solid currentColor",
                        opacity: 0.8,
                      }}
                    >
                      {job.status === "succeeded" ? "✓ Done" :
                       job.status === "failed"    ? "✗ Failed" :
                       job.status === "starting"  ? "Starting…" :
                                                    "Processing…"}
                    </span>
                  )}
                  <button
                    onClick={() => handleCopyOne(scene.id, scene.imagePrompt || buildImagePrompt(scene.sceneDescription))}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors"
                    style={{
                      background: copiedId === scene.id ? "oklch(0.72 0.12 75 / 0.15)" : "oklch(0.22 0.018 52)",
                      color: copiedId === scene.id ? "oklch(0.72 0.12 75)" : "oklch(0.55 0.012 65)",
                      border: `1px solid ${copiedId === scene.id ? "oklch(0.72 0.12 75 / 0.4)" : "oklch(0.25 0.020 55)"}`,
                    }}
                  >
                    {copiedId === scene.id ? <Check size={10} /> : <Copy size={10} />}
                    {copiedId === scene.id ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Image preview + approval */}
              {(() => {
                const displayUrl = scene.imageUrl || job?.imageUrl;
                const approved = scene.imageApproved;
                return displayUrl ? (
                  <div className="space-y-2">
                    <div
                      className="rounded overflow-hidden relative"
                      style={{
                        border: `2px solid ${approved === true ? "oklch(0.60 0.18 145)" : approved === false ? "oklch(0.55 0.18 25)" : "oklch(0.28 0.025 58)"}`,
                        transition: "border-color 200ms",
                      }}
                    >
                      <img
                        src={displayUrl}
                        alt={`Scene ${idx + 1}`}
                        className="w-full object-cover"
                        style={{ maxHeight: "200px" }}
                      />
                      {approved === true && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                          style={{ background: "oklch(0.20 0.10 145 / 0.9)", color: "oklch(0.72 0.18 145)" }}>
                          <Check size={11} /> Approved
                        </div>
                      )}
                      {approved === false && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                          style={{ background: "oklch(0.20 0.08 25 / 0.9)", color: "oklch(0.70 0.18 25)" }}>
                          ✗ Rejected
                        </div>
                      )}
                    </div>
                    {/* Approve / Reject buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateScene(scene.id, { imageApproved: true })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{
                          background: approved === true ? "oklch(0.20 0.10 145)" : "oklch(0.18 0.016 52)",
                          color: approved === true ? "oklch(0.72 0.18 145)" : "oklch(0.55 0.012 65)",
                          border: `1px solid ${approved === true ? "oklch(0.50 0.15 145 / 0.6)" : "oklch(0.28 0.025 58)"}`,
                        }}
                      >
                        <ThumbsUp size={12} /> Approve
                      </button>
                      <button
                        onClick={() => updateScene(scene.id, { imageApproved: false, imageUrl: undefined })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{
                          background: approved === false ? "oklch(0.18 0.08 25)" : "oklch(0.18 0.016 52)",
                          color: approved === false ? "oklch(0.70 0.18 25)" : "oklch(0.55 0.012 65)",
                          border: `1px solid ${approved === false ? "oklch(0.45 0.12 25 / 0.6)" : "oklch(0.28 0.025 58)"}`,
                        }}
                      >
                        <ThumbsDown size={12} /> Reject & Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No image yet — URL paste + file upload */
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Link size={12} style={{ color: "oklch(0.45 0.010 60)", flexShrink: 0 }} />
                      <input
                        type="url"
                        placeholder="Paste image URL from Leonardo AI…"
                        defaultValue={scene.imageUrl || ""}
                        onBlur={(e) => {
                          const url = e.currentTarget.value.trim();
                          if (url) updateScene(scene.id, { imageUrl: url });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const url = e.currentTarget.value.trim();
                            if (url) updateScene(scene.id, { imageUrl: url });
                            e.currentTarget.blur();
                          }
                        }}
                        className="sanctum-input text-xs"
                        style={{ padding: "0.3rem 0.625rem", flex: 1 }}
                      />
                    </div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: uploadingSceneId === scene.id ? "not-allowed" : "pointer",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px dashed oklch(0.35 0.025 58)",
                        color: "oklch(0.50 0.012 65)",
                        fontSize: "0.72rem",
                        transition: "all 150ms",
                        width: "fit-content",
                      }}
                    >
                      {uploadingSceneId === scene.id
                        ? <><Loader2 size={11} className="animate-spin" /> Uploading…</>
                        : <><Upload size={11} /> Upload from computer (saved to R2)</>}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={uploadingSceneId === scene.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(scene.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                );
              })()}

              <textarea
                value={scene.imagePrompt || buildImagePrompt(scene.sceneDescription)}
                onChange={(e) => handleUpdatePrompt(scene.id, e.target.value)}
                className="sanctum-input text-xs"
                rows={3}
                style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "0.375rem 0.625rem", resize: "vertical" }}
              />
            </div>
          );
        })}
      </div>

      {/* Approval summary + Continue */}
      {scenesWithImages > 0 && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: "oklch(0.15 0.014 52)", border: "1px solid oklch(0.25 0.020 55)" }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "oklch(0.60 0.012 65)" }}>Image Approval</span>
            <span style={{ color: approvedCount > 0 ? "oklch(0.72 0.18 145)" : "oklch(0.55 0.012 65)" }}>
              {approvedCount} approved · {rejectedCount} rejected · {scenesWithImages - reviewedCount} pending review
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: "6px", background: "oklch(0.22 0.018 52)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(approvedCount / project.scenes.length) * 100}%`, background: "linear-gradient(90deg, oklch(0.60 0.18 145), oklch(0.72 0.18 145))" }} />
          </div>
          {approvedCount === 0 && scenesWithImages > 0 && (
            <p className="text-xs" style={{ color: "oklch(0.60 0.12 65)" }}>
              👆 Review each image above — approve the ones you want to use in the video
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={approvedCount === 0}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
        style={{
          background: approvedCount > 0
            ? "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))"
            : "oklch(0.20 0.016 52)",
          color: approvedCount > 0 ? "oklch(0.12 0.015 55)" : "oklch(0.40 0.010 60)",
          cursor: approvedCount > 0 ? "pointer" : "not-allowed",
          fontFamily: "'Cinzel', serif",
          opacity: approvedCount > 0 ? 1 : 0.6,
        }}
      >
        Continue to Video Prompts
        {approvedCount > 0 && <span className="text-xs opacity-70">({approvedCount} approved)</span>}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
