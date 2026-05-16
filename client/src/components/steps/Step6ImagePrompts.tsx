// ============================================================
// DESIGN: "Digital Sanctum" — Step 6: Bulk Image Prompts
// Providers: Flux Dev (Replicate) | DALL-E 3 / GPT-image-1 (OpenAI)
// Character Consistency: shared style prefix + seed locking
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, getDefaultCharacterPrefix } from "@/lib/studioData";
import { ChevronRight, Copy, Check, Download, Sparkles, Image, Loader2, AlertCircle, Settings, Shuffle, Lock, Unlock, Zap, ThumbsUp, ThumbsDown, Link, Upload, ChevronDown, ChevronUp, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

type ImageProvider = "flux" | "dalle" | "pollinations" | "together" | "fal";
type FluxModel = "flux-dev" | "flux-schnell" | "seedream-4.5";
type FalImageModel = "flux-schnell" | "flux-dev";
type PollinationsModel = "flux" | "flux-realism" | "turbo";
type DalleModel = "dall-e-3" | "gpt-image-1";

const STYLE_SUFFIXES = [
  "Tanjore devotional painting, gold leaf, jewel tones",
  "Cinematic temple realism, warm lamp light, film still",
  "Epic mythological digital art, divine glow, rich detail",
  "Photorealistic idol and temple photography, golden hour",
  "Painterly devotional illustration, soft sacred atmosphere",
];

const NEGATIVE_PROMPT = "no text, no watermarks, no modern elements, no people in casual clothes, no cars, no phones, no ugly artifacts";

interface ImageJob {
  jobId: string;
  sceneIdx: number;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  imageUrl?: string;
  error?: string;
}

function normalizeImageSrc(value?: string) {
  if (!value) return "";
  if (/^(https?:|data:image\/|blob:|\/)/.test(value)) return value;
  if (value.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
    return `data:image/png;base64,${value.replace(/\s/g, "")}`;
  }
  return value;
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
  const [provider, setProvider] = useState<ImageProvider>("fal");
  const [userSelectedProvider, setUserSelectedProvider] = useState(false);
  const [fluxModel, setFluxModel] = useState<FluxModel>("flux-dev");
  const [dalleModel, setDalleModel] = useState<DalleModel>("dall-e-3");
  const [dalleQuality, setDalleQuality] = useState<"standard" | "hd">("standard");
  const [dalleStyle, setDalleStyle] = useState<"natural" | "vivid">("natural");
  const [falImageModel, setFalImageModel] = useState<FalImageModel>("flux-schnell");
  const [pollinationsModel, setPollinationsModel] = useState<PollinationsModel>("flux");

  // Generation state
  const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
  const [genStatus, setGenStatus] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [isPolling, setIsPolling] = useState(false);
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // AI improve state
  const [improvingId, setImprovingId] = useState<number | null>(null);
  const [llmModel, setLlmModel] = useState<string>("");

  const utils = trpc.useUtils();
  const deity = DEITIES.find((d) => d.key === project.deity);

  // Auto-populate character prefix when deity is first selected and prefix is empty
  useEffect(() => {
    if (deity && !project.characterPrefix) {
      setCharacterPrefix(getDefaultCharacterPrefix(deity));
    }
  }, [deity, project.characterPrefix, setCharacterPrefix]);

  // Fetch user settings (both Replicate and OpenAI keys)
  const { data: envKeyStatus } = trpc.settings.getEnvKeyStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: userSettings } = trpc.settings.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const replicateApiKey = userSettings?.replicateApiKey || "";
  const openaiApiKey = userSettings?.openaiApiKey || "";
  const falApiKey = (userSettings as any)?.falApiKey || "";
  const togetherApiKey = (userSettings as any)?.togetherApiKey || "";

  // Derived: which key is needed for selected provider (Pollinations needs none)
  const hasOpenAIKey = Boolean(envKeyStatus?.openaiApiKey || openaiApiKey);
  const hasReplicateKey = Boolean(envKeyStatus?.replicateApiKey || replicateApiKey);
  const hasFalKey = Boolean(envKeyStatus?.falApiKey || falApiKey);
  const hasTogetherKey = Boolean(envKeyStatus?.togetherApiKey || togetherApiKey);

  const activeApiKey = provider === "dalle" ? (hasOpenAIKey ? "configured" : "")
    : provider === "together" ? (hasTogetherKey ? "configured" : "")
    : provider === "fal" ? (hasFalKey ? "configured" : "")
    : provider === "pollinations" ? "free"
    : (hasReplicateKey ? "configured" : "");
  const missingKeyRoute = "/settings";

  const providerKeyLabel: Record<Exclude<ImageProvider, "pollinations">, string> = {
    dalle: "OpenAI",
    flux: "Replicate",
    together: "Together AI",
    fal: "fal.ai",
  };
  const pollinationsBatchBlocked = provider === "pollinations" && project.scenes.length > 4;

  useEffect(() => {
    if (userSelectedProvider || !envKeyStatus) return;
    if (hasFalKey) {
      setProvider("fal");
    } else if (hasTogetherKey) {
      setProvider("together");
    } else if (hasOpenAIKey) {
      setProvider("dalle");
    } else if (hasReplicateKey) {
      setProvider("flux");
    }
  }, [envKeyStatus, hasFalKey, hasTogetherKey, hasOpenAIKey, hasReplicateKey, userSelectedProvider]);

  const generateImagesMutation = trpc.generation.generateImages.useMutation();
  const improvePromptMutation = trpc.generation.improvePrompt.useMutation();

  // Sync llmModel from user settings (fallback to gemini-2.5-flash)
  useEffect(() => {
    if (userSettings?.llmModel && !llmModel) setLlmModel(userSettings.llmModel);
  }, [userSettings?.llmModel]);

  const handleImprovePrompt = async (sceneId: number, currentPrompt: string) => {
    setImprovingId(sceneId);
    try {
      const scene = project.scenes.find((s) => s.id === sceneId);
      const result = await improvePromptMutation.mutateAsync({
        type: "image",
        currentPrompt,
        sceneDescription: scene?.sceneDescription,
        lyricLine: scene?.lyricLine,
        deity: project.deity ?? undefined,
        masterPrompt: project.masterPrompt || undefined,
        llmModel: llmModel || undefined,
      });
      if (result.success && result.data?.improved) {
        handleUpdatePrompt(sceneId, result.data.improved);
        toast.success("Prompt improved!");
      } else {
        toast.error(result.error || "Could not improve prompt");
      }
    } catch {
      toast.error("Failed to improve prompt");
    } finally {
      setImprovingId(null);
    }
  };

  const buildImagePrompt = useCallback((sceneDesc: string) => {
    const styleSuffix = STYLE_SUFFIXES[selectedStyle];
    // Incorporate Master Prompt guidance into image generation
    const masterPromptGuidance = project.masterPrompt
      ? `Guided by: ${project.masterPrompt}. `
      : "";
    return `${masterPromptGuidance}${sceneDesc}. ${styleSuffix}, warm amber and gold lighting from oil lamps, incense smoke, South Indian temple architecture, intricate stone carvings, sacred and divine atmosphere, ultra-detailed, high quality`;
  }, [selectedStyle, project.masterPrompt]);

  const buildImageGenerationInput = (prompts: string[]) => {
    const stylePrefix = project.characterPrefix || undefined;
    return provider === "dalle"
      ? { prompts, provider: "dalle" as const, openaiApiKey, dalleModel, dalleQuality, dalleStyle, stylePrefix }
      : provider === "pollinations"
      ? { prompts, provider: "pollinations" as const, pollinationsModel, stylePrefix }
      : provider === "together"
      ? { prompts, provider: "together" as const, togetherApiKey, stylePrefix }
      : provider === "fal"
      ? { prompts, provider: "fal" as const, falApiKey, falModel: falImageModel, stylePrefix }
      : { prompts, provider: "flux" as const, replicateApiKey, model: fluxModel, width: 1024, height: 576, stylePrefix, seed: project.imageSeed ?? undefined };
  };

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
            const imageUrl = normalizeImageSrc(Array.isArray(rawOutput) ? rawOutput[0] : (rawOutput as string | undefined));
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
    if (provider !== "pollinations" && !activeApiKey) {
      const msgs: Record<ImageProvider, string> = {
        dalle: "Add your OpenAI API key in Settings",
        flux: "Add your Replicate API key in Settings",
        together: "Add your Together AI key in Settings (free at api.together.ai)",
        fal: "Add your fal.ai key in Settings (free at fal.ai)",
        pollinations: "",
      };
      toast.error(msgs[provider]);
      return;
    }
    if (pollinationsBatchBlocked) {
      toast.error("Pollinations free is rate-limited for bulk generation. Use fal.ai, Together, OpenAI, or Replicate for full-scene batches.");
      return;
    }

    setGenStatus("submitting");
    setImageJobs([]);

    try {
      const prompts = project.scenes.map((s) =>
        s.imagePrompt || buildImagePrompt(s.sceneDescription)
      );

      const result = await generateImagesMutation.mutateAsync(buildImageGenerationInput(prompts));

      if (!result.success || !result.data) {
        throw new Error(result.error || "Generation failed to start");
      }

      const jobs: ImageJob[] = result.data.map((job, idx) => ({
        jobId: job.id,
        sceneIdx: idx,
        status: job.status as ImageJob["status"],
        imageUrl: normalizeImageSrc(Array.isArray(job.output) ? job.output[0] : (job.output as string | undefined)),
      }));

      // For DALL-E, save image URLs immediately (results come back in one shot)
      jobs.forEach((job) => {
        if (job.status === "succeeded" && job.imageUrl) {
          const scene = project.scenes[job.sceneIdx];
          if (scene) updateScene(scene.id, { imageUrl: job.imageUrl });
        }
      });

      setImageJobs(jobs);

      const immediateProviders: ImageProvider[] = ["dalle", "pollinations", "together", "fal"];
      if (immediateProviders.includes(provider)) {
        setGenStatus("done");
        const succeeded = jobs.filter((j) => j.status === "succeeded").length;
        const label = provider === "pollinations" ? "Pollinations (free)"
          : provider === "together" ? "Together AI (free)"
          : provider === "fal" ? "fal.ai"
          : dalleModel;
        toast.success(`${succeeded}/${jobs.length} images ready via ${label}!`);
      } else {
        setGenStatus("polling");
        setIsPolling(true);
        const modelLabel = fluxModel === "seedream-4.5" ? "Seedream 4.5" : fluxModel === "flux-schnell" ? "Flux Schnell" : "Flux Dev";
        toast.success(`Generating ${prompts.length} images via ${modelLabel}...`);
      }
    } catch (error) {
      setGenStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to start generation");
    }
  };

  const handleRegenerateOneImage = async (sceneId: number, sceneIndex: number, prompt: string) => {
    if (provider !== "pollinations" && !activeApiKey) {
      const msgs: Record<ImageProvider, string> = {
        dalle: "Add your OpenAI API key in Settings",
        flux: "Add your Replicate API key in Settings",
        together: "Add your Together AI key in Settings",
        fal: "Add your fal.ai key in Settings",
        pollinations: "",
      };
      toast.error(msgs[provider]);
      return;
    }

    setRegeneratingSceneId(sceneId);
    updateScene(sceneId, { imageUrl: undefined, imageApproved: undefined });

    try {
      const result = await generateImagesMutation.mutateAsync(buildImageGenerationInput([prompt]));
      if (!result.success || !result.data?.[0]) {
        throw new Error(result.error || "Image regeneration failed");
      }

      const returnedJob = result.data[0];
      const imageUrl = normalizeImageSrc(Array.isArray(returnedJob.output) ? returnedJob.output[0] : (returnedJob.output as string | undefined));
      const newJob: ImageJob = {
        jobId: returnedJob.id,
        sceneIdx: sceneIndex,
        status: returnedJob.status as ImageJob["status"],
        imageUrl,
        error: returnedJob.error,
      };

      setImageJobs((prev) => [
        ...prev.filter((job) => job.sceneIdx !== sceneIndex),
        newJob,
      ]);

      if (newJob.status === "succeeded" && imageUrl) {
        updateScene(sceneId, { imageUrl });
        toast.success(`Scene ${sceneIndex + 1} image regenerated`);
      } else {
        setGenStatus("polling");
        setIsPolling(true);
        toast.success(`Regenerating scene ${sceneIndex + 1} image...`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate image");
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  const handleImageLoadError = (sceneId: number, sceneIndex: number) => {
    updateScene(sceneId, { imageUrl: undefined, imageApproved: undefined });
    setImageJobs((prev) =>
      prev.map((job) =>
        job.sceneIdx === sceneIndex
          ? { ...job, status: "failed", imageUrl: undefined, error: "Image failed to load" }
          : job
      )
    );
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
    background: "#2f2f2f",
    border: "1px solid oklch(0.72 0.12 75 / 0.16)",
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
    background: "#2a2a2a",
    border: "1px solid oklch(0.72 0.12 75 / 0.18)",
    borderRadius: "0.5rem",
    color: "rgba(255,255,255,0.88)",
    fontSize: "0.875rem",
    outline: "none",
  } as const;

  const selectStyle = {
    ...fieldStyle,
    color: "oklch(0.72 0.12 75)",
    fontWeight: 600,
    cursor: "pointer",
  } as const;

  if (project.scenes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>Step 6</p>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>Image Prompts</h2>
        </div>
        <div className="text-center py-12 rounded-lg" style={{ border: "2px dashed rgba(255,255,255,0.1)", color: "rgba(236,236,241,0.35)" }}>
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please complete Step 3 (Scene Breakdown) first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>
            Step 4
          </p>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>
            Image Prompts
          </h2>
          <p className="text-sm mt-1" style={{ color: "rgba(236,236,241,0.6)" }}>
            Generate images in-app or copy prompts for Leonardo AI / Midjourney. Master Prompt guides visual consistency.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 mt-1">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#ececf1", border: "1px solid rgba(255,255,255,0.12)" }}>
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
            <p className="text-xs font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
              📋 Master Creative Vision (Reference)
            </p>
            {showMasterPrompt ? (
              <ChevronUp size={16} style={{ color: "rgba(236,236,241,0.45)" }} />
            ) : (
              <ChevronDown size={16} style={{ color: "rgba(236,236,241,0.45)" }} />
            )}
          </button>
          {showMasterPrompt && (
            <div
              className="text-xs leading-relaxed p-3 rounded"
              style={{
                background: "#2f2f2f",
                color: "rgba(236,236,241,0.62)",
                border: "1px solid rgba(255,255,255,0.08)",
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
          <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
            Image setup
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
            Set the character look and art style once so every scene feels like the same video.
          </p>
        </div>

        {/* Style Lock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(236,236,241,0.45)" }}>
              Character look
            </span>
            {deity && (
              <button
                onClick={() => setCharacterPrefix(getDefaultCharacterPrefix(deity))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors"
                style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.58)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Sparkles size={9} />
                Reset to {deity.name} default
              </button>
            )}
          </div>
          <textarea
            value={project.characterPrefix}
            onChange={(e) => setCharacterPrefix(e.target.value)}
            placeholder="Describe the repeated character look: Lord Rama with blue skin, bow and arrow, royal attire, same face and costume in every scene..."
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
          <p className="text-xs" style={{ color: "rgba(236,236,241,0.35)" }}>
            Best for consistency: include deity appearance, clothing, colors, and “same face/costume in every scene”.
          </p>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)" }} />

        {/* Art Style dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(236,236,241,0.45)" }}>
              Visual style
            </span>
            <button
              onClick={() => setShowNegative(!showNegative)}
              className="text-xs"
              style={{ color: "rgba(236,236,241,0.35)" }}
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
            <p className="text-xs leading-relaxed" style={{ color: "rgba(236,236,241,0.35)", fontStyle: "italic" }}>
              {NEGATIVE_PROMPT}
            </p>
          )}
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)" }} />

        {/* Consistency + Actions row */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap">
          <span className="text-xs font-semibold col-span-2 sm:col-span-1" style={{ color: "rgba(236,236,241,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Seed</span>
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
              width: "100%",
              maxWidth: "100px",
            }}
          />
          <button
            onClick={handleRandomSeed}
            className="flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.58)", border: "1px solid rgba(255,255,255,0.1)" }}
            title="Create a fixed seed for more consistent images"
          >
            <Shuffle size={10} />
            New seed
          </button>
          <button
            onClick={handleToggleSeedLock}
            className="flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{
              background: seedLocked ? "oklch(0.18 0.06 150 / 0.3)" : "#2a2a2a",
              color: seedLocked ? "oklch(0.72 0.12 145)" : "rgba(236,236,241,0.4)",
              border: `1px solid ${seedLocked ? "oklch(0.50 0.12 145 / 0.5)" : "rgba(255,255,255,0.1)"}`,
            }}
            title={seedLocked ? "Unlock seed" : "Lock seed"}
          >
            {seedLocked ? <Lock size={10} /> : <Unlock size={10} />}
            {seedLocked ? "Seed locked" : "Seed off"}
          </button>
          <div className="hidden sm:block flex-1" />
          <button
            onClick={handleRegenerateAll}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.58)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Sparkles size={11} />
            Apply style to all
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: copiedAll ? "rgba(255,255,255,0.08)" : "#2a2a2a",
              color: copiedAll ? "rgba(236,236,241,0.82)" : "rgba(236,236,241,0.58)",
              border: `1px solid ${copiedAll ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            {copiedAll ? <Check size={11} /> : <Copy size={11} />}
            {copiedAll ? "Copied!" : "Copy prompts"}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors col-span-2 sm:col-span-1"
            style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.58)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Download size={11} />
            Download prompts
          </button>
        </div>
        {seedLocked && project.imageSeed !== null && (
          <p className="text-xs" style={{ color: "rgba(236,236,241,0.4)" }}>
            Seed <span style={{ color: "oklch(0.72 0.12 145)", fontFamily: "monospace" }}>{project.imageSeed}</span> is locked for providers that support it, helping the generated scenes stay visually consistent.
          </p>
        )}
        {!seedLocked && (
          <p className="text-xs" style={{ color: "rgba(236,236,241,0.35)" }}>
            Seed is optional. Turn it on when you want the same style repeated across all scenes.
          </p>
        )}
      </div>

      {/* In-app Generation Panel */}
      <div className="p-4 space-y-4" style={panelStyle}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
            Generate in app
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
            Provider is auto-selected from Railway keys when available. Pollinations is only a small-batch fallback.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Provider</label>
            <select
              value={provider}
              onChange={(e) => {
                setUserSelectedProvider(true);
                setProvider(e.target.value as ImageProvider);
              }}
              style={selectStyle}
            >
              <optgroup label="Recommended for batches">
                <option value="fal">fal.ai — recommended for reliable batches</option>
                <option value="together">Together AI — free tier if key configured</option>
              </optgroup>
              <optgroup label="Test fallback">
                <option value="pollinations">Pollinations.ai — 1-4 test images only</option>
              </optgroup>
              <optgroup label="Paid (pay per image)">
                <option value="flux">Flux via Replicate (~$0.01/image)</option>
                <option value="dalle">DALL-E / GPT-image (OpenAI)</option>
              </optgroup>
            </select>
          </div>

          {provider === "pollinations" && (
            <div>
              <label style={labelStyle}>Model</label>
              <select value={pollinationsModel} onChange={(e) => setPollinationsModel(e.target.value as PollinationsModel)} style={selectStyle}>
                <option value="flux">Flux — best quality (default)</option>
                <option value="flux-realism">Flux Realism — photorealistic</option>
                <option value="turbo">Turbo — fastest</option>
              </select>
            </div>
          )}

          {provider === "fal" && (
            <div>
              <label style={labelStyle}>Model</label>
              <select value={falImageModel} onChange={(e) => setFalImageModel(e.target.value as FalImageModel)} style={selectStyle}>
                <option value="flux-schnell">FLUX Schnell — fast, free-tier friendly</option>
                <option value="flux-dev">FLUX Dev — higher quality</option>
              </select>
            </div>
          )}

          {provider === "flux" && (
            <div>
              <label style={labelStyle}>Model</label>
              <select value={fluxModel} onChange={(e) => setFluxModel(e.target.value as FluxModel)} style={selectStyle}>
                <option value="seedream-4.5">Seedream 4.5 — ByteDance, best spatial quality (~$0.04)</option>
                <option value="flux-dev">Flux Dev — best quality (~$0.01)</option>
                <option value="flux-schnell">Flux Schnell — faster, cheaper (~$0.003)</option>
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
                  <option value="standard">Standard — lower cost</option>
                  <option value="hd">HD — higher detail</option>
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

        {/* Provider info note */}
        {provider === "pollinations" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(16, 163, 127, 0.07)", border: "1px solid rgba(16,163,127,0.25)" }}>
            <p className="text-xs" style={{ color: "rgba(236,236,241,0.6)" }}>
              <strong style={{ color: "#10a37f" }}>No key needed</strong>, but this endpoint is rate-limited and can fail on full song batches. Use it for 1-4 test images only.
            </p>
            {pollinationsBatchBlocked && (
              <p className="text-xs mt-2" style={{ color: "oklch(0.74 0.16 45)" }}>
                This project has {project.scenes.length} scenes. Select fal.ai, Together, OpenAI, or Replicate to generate the full batch.
              </p>
            )}
          </div>
        )}
        {provider === "together" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(16, 163, 127, 0.07)", border: "1px solid rgba(16,163,127,0.25)" }}>
            <p className="text-xs" style={{ color: "rgba(236,236,241,0.6)" }}>
              ✓ <strong style={{ color: "#10a37f" }}>{hasTogetherKey ? "Key configured" : "Free tier"}</strong> — FLUX.1-schnell-Free is available at no cost. {hasTogetherKey ? "Ready for batch generation." : "Add your Together AI key in Settings or Railway Variables."}
            </p>
          </div>
        )}
        {provider === "fal" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(16, 163, 127, 0.07)", border: "1px solid rgba(16,163,127,0.25)" }}>
            <p className="text-xs" style={{ color: "rgba(236,236,241,0.6)" }}>
              ✓ <strong style={{ color: "#10a37f" }}>{hasFalKey ? "Key configured" : "Free credits on signup"}</strong> — recommended for reliable full-scene batches. {hasFalKey ? "Ready for batch generation." : "Add your fal.ai key in Settings or Railway Variables."}
            </p>
          </div>
        )}
        {provider === "flux" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.48)" }}>
              {fluxModel === "seedream-4.5"
                ? "Seedream 4.5 by ByteDance — 19M+ runs, strong spatial understanding and world knowledge. Great for detailed devotional scenes (~$0.04/image via Replicate)."
                : fluxModel === "flux-dev"
                ? "Flux Dev — best quality for final images (~$0.01/image via Replicate)."
                : "Flux Schnell — faster and cheaper. Good for drafts (~$0.003/image via Replicate)."}
            </p>
          </div>
        )}
        {provider === "dalle" && (
          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "rgba(236,236,241,0.35)" }}>
              DALL-E generates at 1792×1024 (16:9). Results return immediately — no polling needed.
              {dalleModel === "dall-e-3" && " Seed locking is not supported by DALL-E 3."}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#ececf1" }}>
              Generate in App
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(236,236,241,0.4)" }}>
              {provider === "pollinations" ? "Small-batch fallback · Pollinations.ai"
                : provider === "together" ? `Together AI (FLUX.1-schnell) · ${hasTogetherKey ? "key ready" : "key needed"}`
                : provider === "fal" ? `fal.ai (${falImageModel}) · ${hasFalKey ? "key ready" : "key needed"}`
                : provider === "dalle" ? `${dalleModel === "dall-e-3" ? "DALL-E 3" : "GPT-image-1"} via OpenAI · ${hasOpenAIKey ? "key ready" : "key needed"}`
                : `Flux ${fluxModel === "flux-dev" ? "Dev" : "Schnell"} via Replicate · ~$0.01/image${project.imageSeed !== null ? ` · seed ${project.imageSeed}` : ""}`}
            </p>
          </div>
          {provider !== "pollinations" && !activeApiKey ? (
            <button
              onClick={() => navigate(missingKeyRoute)}
              className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.58)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Settings size={11} />
              Add {providerKeyLabel[provider as Exclude<ImageProvider, "pollinations">]} Key
            </button>
          ) : (
            <button
              onClick={handleGenerateImages}
              disabled={genStatus === "submitting" || genStatus === "polling" || pollinationsBatchBlocked}
              className="flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded transition-all font-semibold"
              style={{
                background:
                  genStatus === "submitting" || genStatus === "polling" || pollinationsBatchBlocked
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(135deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))",
                color:
                  genStatus === "submitting" || genStatus === "polling" || pollinationsBatchBlocked
                    ? "rgba(236,236,241,0.45)"
                    : "#181818",
                border: "none",
                cursor: genStatus === "submitting" || genStatus === "polling" || pollinationsBatchBlocked ? "not-allowed" : "pointer",
              }}
            >
              {genStatus === "submitting" ? (
                <><Loader2 size={12} className="animate-spin" /> {provider === "dalle" ? "Generating…" : "Starting…"}</>
              ) : genStatus === "polling" ? (
                <><Loader2 size={12} className="animate-spin" /> {doneCount}/{imageJobs.length} done</>
              ) : pollinationsBatchBlocked ? (
                <><AlertCircle size={12} /> Choose batch provider</>
              ) : (
                <><Image size={12} /> Generate {project.scenes.length} Images</>
              )}
            </button>
          )}
        </div>

        {/* Generation progress bar */}
        {imageJobs.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs" style={{ color: "rgba(236,236,241,0.45)" }}>
              <span>{doneCount} generated · {pendingCount} pending · {imageJobs.filter(j => j.status === "failed").length} failed</span>
              {genStatus === "done" && <span style={{ color: "rgba(236,236,241,0.82)" }}>✓ Complete</span>}
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "#2a2a2a" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneCount / imageJobs.length) * 100}%`,
                  background: "linear-gradient(90deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))",
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

      {/* LLM model selector for AI improve */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Wand2 size={13} style={{ color: "#10a37f", flexShrink: 0 }} />
        <span className="text-xs font-medium" style={{ color: "rgba(236,236,241,0.55)" }}>AI model for ✨ Improve:</span>
        <select
          value={llmModel || "gemini-2.5-flash"}
          onChange={(e) => setLlmModel(e.target.value)}
          style={{ flex: 1, width: "100%", minWidth: 0, padding: "0.25rem 0.5rem", background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.375rem", color: "#ececf1", fontSize: "0.72rem" }}
        >
          <option value="gemini-2.5-flash">Gemini 2.5 Flash (default)</option>
          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="llama-3.1-8b-instant">Llama 3.1 8B (Groq)</option>
          <option value="mistral-small-latest">Mistral Small</option>
        </select>
      </div>

      {/* Prompt list */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {project.scenes.map((scene, idx) => {
          const job = imageJobs.find((j) => j.sceneIdx === idx);
          return (
            <div key={scene.id} className="shrine-panel p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(236,236,241,0.82)" }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="text-sm telugu-text truncate max-w-[240px] min-w-0"
                    style={{ color: "rgba(236,236,241,0.72)" }}
                  >
                    {scene.lyricLine || "Scene " + (idx + 1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Job status badge */}
                  {job && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background:
                          job.status === "succeeded" ? "oklch(0.18 0.06 150)" :
                          job.status === "failed"    ? "oklch(0.18 0.05 20)"  :
                                                       "#2a2a2a",
                        color:
                          job.status === "succeeded" ? "oklch(0.72 0.12 145)" :
                          job.status === "failed"    ? "oklch(0.70 0.15 25)"  :
                                                       "rgba(236,236,241,0.45)",
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
                    className="flex items-center justify-center gap-1 text-xs px-2.5 py-1 rounded transition-colors"
                    style={{
                      background: copiedId === scene.id ? "rgba(255,255,255,0.06)" : "#2a2a2a",
                      color: copiedId === scene.id ? "rgba(236,236,241,0.82)" : "rgba(236,236,241,0.45)",
                      border: `1px solid ${copiedId === scene.id ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    {copiedId === scene.id ? <Check size={10} /> : <Copy size={10} />}
                    {copiedId === scene.id ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Image preview + approval */}
              {(() => {
                const displayUrl = normalizeImageSrc(scene.imageUrl || job?.imageUrl);
                const approved = scene.imageApproved;
                return displayUrl ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: displayUrl, title: `Scene ${idx + 1}` })}
                      className="rounded overflow-hidden relative"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: 0,
                        background: "#202020",
                        border: `2px solid ${approved === true ? "oklch(0.60 0.18 145)" : approved === false ? "oklch(0.55 0.18 25)" : "rgba(255,255,255,0.1)"}`,
                        cursor: "zoom-in",
                        transition: "border-color 200ms",
                        textAlign: "left",
                      }}
                    >
                      <img
                        src={displayUrl}
                        alt={`Scene ${idx + 1}`}
                        onError={() => handleImageLoadError(scene.id, idx)}
                        style={{ display: "block", width: "100%", maxHeight: "240px", objectFit: "contain", background: "#202020" }}
                      />
                      <div
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ background: "rgba(0,0,0,0.65)", color: "rgba(236,236,241,0.9)" }}
                      >
                        Tap to view
                      </div>
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
                    </button>
                    {/* Approve / Reject buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateScene(scene.id, { imageApproved: true })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{
                          background: approved === true ? "oklch(0.20 0.10 145)" : "#2a2a2a",
                          color: approved === true ? "oklch(0.72 0.18 145)" : "rgba(236,236,241,0.45)",
                          border: `1px solid ${approved === true ? "oklch(0.50 0.15 145 / 0.6)" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        <ThumbsUp size={12} /> Approve
                      </button>
                      <button
                        onClick={() => updateScene(scene.id, { imageApproved: false, imageUrl: undefined })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{
                          background: approved === false ? "oklch(0.18 0.08 25)" : "#2a2a2a",
                          color: approved === false ? "oklch(0.70 0.18 25)" : "rgba(236,236,241,0.45)",
                          border: `1px solid ${approved === false ? "oklch(0.45 0.12 25 / 0.6)" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        <ThumbsDown size={12} /> Reject & Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No image yet — URL paste + file upload */
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link size={12} style={{ color: "rgba(236,236,241,0.35)", flexShrink: 0 }} />
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
                        style={{ padding: "0.3rem 0.625rem", flex: 1, minWidth: 0 }}
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
                        border: "1px dashed rgba(255,255,255,0.12)",
                        color: "rgba(236,236,241,0.4)",
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

              {/* Prompt textarea + per-scene actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <textarea
                  value={scene.imagePrompt || buildImagePrompt(scene.sceneDescription)}
                  onChange={(e) => handleUpdatePrompt(scene.id, e.target.value)}
                  className="sanctum-input text-xs"
                  rows={3}
                  style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "0.375rem 0.625rem", resize: "vertical" }}
                />
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                  <button
                    onClick={() => handleRegenerateOneImage(scene.id, idx, scene.imagePrompt || buildImagePrompt(scene.sceneDescription))}
                    disabled={regeneratingSceneId === scene.id || genStatus === "submitting"}
                    className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all"
                    style={{
                      background: regeneratingSceneId === scene.id ? "rgba(236,236,241,0.08)" : "rgba(236,236,241,0.12)",
                      border: "1px solid rgba(236,236,241,0.24)",
                      color: regeneratingSceneId === scene.id ? "rgba(236,236,241,0.45)" : "rgba(236,236,241,0.82)",
                      cursor: regeneratingSceneId === scene.id || genStatus === "submitting" ? "wait" : "pointer",
                    }}
                  >
                    {regeneratingSceneId === scene.id
                      ? <><Loader2 size={11} className="animate-spin" /> Regenerating…</>
                      : <><RefreshCw size={11} /> Regenerate image</>}
                  </button>
                  <button
                    onClick={() => handleImprovePrompt(scene.id, scene.imagePrompt || buildImagePrompt(scene.sceneDescription))}
                    disabled={improvingId === scene.id}
                    className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all"
                    style={{
                      background: improvingId === scene.id ? "rgba(16,163,127,0.08)" : "rgba(16,163,127,0.12)",
                      border: "1px solid rgba(16,163,127,0.3)",
                      color: improvingId === scene.id ? "rgba(16,163,127,0.5)" : "#10a37f",
                      cursor: improvingId === scene.id ? "wait" : "pointer",
                    }}
                  >
                    {improvingId === scene.id
                      ? <><Loader2 size={11} className="animate-spin" /> Improving…</>
                      : <><Wand2 size={11} /> Improve with AI</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approval summary + Continue */}
      {scenesWithImages > 0 && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: "#2f2f2f", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
            <span style={{ color: "rgba(236,236,241,0.52)" }}>Image Approval</span>
            <span style={{ color: approvedCount > 0 ? "oklch(0.72 0.18 145)" : "rgba(236,236,241,0.45)" }}>
              {approvedCount} approved · {rejectedCount} rejected · {scenesWithImages - reviewedCount} pending review
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: "6px", background: "#2a2a2a" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(approvedCount / project.scenes.length) * 100}%`, background: "linear-gradient(90deg, oklch(0.60 0.18 145), oklch(0.72 0.18 145))" }} />
          </div>
          {approvedCount === 0 && scenesWithImages > 0 && (
            <p className="text-xs" style={{ color: "rgba(236,236,241,0.52)" }}>
              👆 Review each image above — approve the ones you want to use in the video
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={approvedCount === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
        style={{
          background: approvedCount > 0
            ? "linear-gradient(135deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))"
            : "#2a2a2a",
          color: approvedCount > 0 ? "#181818" : "rgba(236,236,241,0.3)",
          cursor: approvedCount > 0 ? "pointer" : "not-allowed",
          opacity: approvedCount > 0 ? 1 : 0.6,
        }}
      >
        Continue to Video Prompts
        {approvedCount > 0 && <span className="text-xs opacity-70">({approvedCount} approved)</span>}
        <ChevronRight size={16} />
      </button>

      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "1100px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <p style={{ margin: 0, color: "#ececf1", fontWeight: 700 }}>{previewImage.title}</p>
              <button
                onClick={() => setPreviewImage(null)}
                style={{ width: "40px", height: "40px", borderRadius: "0.5rem", background: "rgba(255,255,255,0.08)", color: "#ececf1", border: "1px solid rgba(255,255,255,0.16)", fontSize: "1.5rem", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              style={{ maxWidth: "100%", maxHeight: "calc(90vh - 64px)", objectFit: "contain", borderRadius: "0.5rem", background: "#202020" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
