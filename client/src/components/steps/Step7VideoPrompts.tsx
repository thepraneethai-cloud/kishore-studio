// ============================================================
// DESIGN: "Digital Sanctum" — Step 5: Video Motion Prompts
// ============================================================
import { useEffect, useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { ChevronRight, Copy, Check, Download, Video, ChevronDown, ChevronUp, Loader2, AlertCircle, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface VideoJob {
  jobId: string;
  sceneId: number;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  videoUrl?: string;
  error?: string;
}

function normalizeVideoSrc(value?: string) {
  if (!value) return "";
  if (/^(https?:|data:video\/|blob:|\/)/.test(value)) return value;
  if (value.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
    return `data:video/mp4;base64,${value.replace(/\s/g, "")}`;
  }
  return value;
}

function isHostedUrl(value?: string) {
  return /^https?:\/\//.test(value || "");
}

function isInlineImage(value?: string) {
  if (!value) return false;
  return value.startsWith("data:image/") || (value.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(value));
}

function imageValueToDataUrl(value: string) {
  if (value.startsWith("data:image/")) return value;
  return `data:image/png;base64,${value.replace(/\s/g, "")}`;
}

async function imageValueToBlob(value: string) {
  const response = await fetch(imageValueToDataUrl(value));
  return response.blob();
}

const MOTION_TYPES = [
  { id: "push", label: "Slow Push-In", template: "Slow camera push-in (0.3x zoom over 6 seconds), {scene}, soft particle glow on light sources, subtle smoke drift, lamp flames flickering, smooth meditative motion" },
  { id: "pan", label: "Gentle Pan", template: "Slow horizontal pan left-to-right (0.2x speed), {scene}, warm light rays shifting, incense smoke drifting, sacred atmosphere" },
  { id: "zoom", label: "Ken Burns Zoom", template: "Ken Burns effect: slow zoom from wide to close-up (0.4x over 8 seconds), {scene}, depth of field blur, golden bokeh particles" },
  { id: "static", label: "Static + Particles", template: "Static shot with animated elements: {scene}, floating golden light particles, flickering lamp flames, smoke wisps, subtle shimmer effect" },
  { id: "orbit", label: "Orbital Rotate", template: "Slow orbital camera rotation (0.1x speed), {scene}, divine glow pulsing, light rays sweeping, ethereal atmosphere" },
];

export default function Step7VideoPrompts() {
  const { project, setScenes, setActiveStep, markStepComplete } = useProject();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedMotion, setSelectedMotion] = useState(0);
  const [sceneSource, setSceneSource] = useState<"approved" | "all">("approved");
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [genStatus, setGenStatus] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [isPolling, setIsPolling] = useState(false);
  const [videoProvider, setVideoProvider] = useState<"wan" | "kling" | "replicate" | "zsky">("wan");
  const [falVideoModel, setFalVideoModel] = useState<"wan" | "kling">("wan");

  const utils = trpc.useUtils();
  const { data: userSettings } = trpc.settings.getSettings.useQuery();
  const { data: envKeyStatus } = trpc.settings.getEnvKeyStatus.useQuery();
  const generateVideosMutation = trpc.generation.generateVideos.useMutation();
  const generateVideosFalMutation = trpc.generation.generateVideosFal.useMutation();
  const generateVideosZskyMutation = trpc.generation.generateVideosZsky.useMutation();
  const improvePromptMutation = trpc.generation.improvePrompt.useMutation();

  // AI improve state
  const [improvingId, setImprovingId] = useState<number | null>(null);
  const [llmModel, setLlmModel] = useState<string>("");

  // Sync llmModel from user settings
  useEffect(() => {
    if (userSettings?.llmModel && !llmModel) setLlmModel(userSettings.llmModel);
  }, [userSettings?.llmModel]);

  const handleUpdateMotionPrompt = (sceneId: number, value: string) => {
    setScenes(project.scenes.map((s) => (s.id === sceneId ? { ...s, motionPrompt: value } : s)));
  };

  const handleImproveMotionPrompt = async (sceneId: number, currentPrompt: string) => {
    setImprovingId(sceneId);
    try {
      const scene = project.scenes.find((s) => s.id === sceneId);
      const result = await improvePromptMutation.mutateAsync({
        type: "motion",
        currentPrompt,
        sceneDescription: scene?.sceneDescription,
        lyricLine: scene?.lyricLine,
        deity: project.deity ?? undefined,
        masterPrompt: project.masterPrompt || undefined,
        llmModel: llmModel || undefined,
      });
      if (result.success && result.data?.improved) {
        handleUpdateMotionPrompt(sceneId, result.data.improved);
        toast.success("Motion prompt improved!");
      } else {
        toast.error(result.error || "Could not improve prompt");
      }
    } catch {
      toast.error("Failed to improve prompt");
    } finally {
      setImprovingId(null);
    }
  };

  useEffect(() => {
    if (!isPolling || videoJobs.length === 0) return;

    const pending = videoJobs.filter((job) => job.status === "starting" || job.status === "processing");
    if (pending.length === 0) {
      setIsPolling(false);
      setGenStatus("done");
      const succeeded = videoJobs.filter((job) => job.status === "succeeded").length;
      toast.success(`${succeeded}/${videoJobs.length} video clips ready!`);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const replicateApiKey = userSettings?.replicateApiKey || "";
        const falApiKey = (userSettings as any)?.falApiKey || "";

        if (videoProvider === "wan" || videoProvider === "kling") {
          if (!falApiKey) return;
          const falJobs = pending.map((j) => ({ requestId: j.jobId, model: falVideoModel, sceneId: j.sceneId }));
          const result = await utils.generation.pollFalJobs.fetch({ jobs: falJobs, falApiKey });
          if (!result.success || !result.data) return;
          const updatedJobs = videoJobs.map((job) => {
            const updated = result.data!.find((r) => r.requestId === job.jobId);
            if (!updated) return job;
            const statusMap = { completed: "succeeded", failed: "failed", processing: "processing", queued: "starting" } as const;
            const status = statusMap[updated.status as keyof typeof statusMap] || "starting";
            return { ...job, status: status as VideoJob["status"], videoUrl: updated.videoUrl || job.videoUrl, error: updated.error };
          });
          setVideoJobs(updatedJobs);
          setScenes(project.scenes.map((scene) => {
            const job = updatedJobs.find((item) => item.sceneId === scene.id && item.status === "succeeded" && item.videoUrl);
            return job ? { ...scene, videoUrl: job.videoUrl } : scene;
          }));
          return;
        }

        // Replicate path
        if (!replicateApiKey) return;
        const result = await utils.generation.pollJobs.fetch({
          jobIds: pending.map((job) => job.jobId),
          replicateApiKey,
        });
        if (!result.success || !result.data) return;

        const updatedJobs = videoJobs.map((job) => {
          const updated = result.data!.find((item) => item.id === job.jobId);
          if (!updated) return job;
          const videoUrl = normalizeVideoSrc(Array.isArray(updated.output) ? updated.output[0] : (updated.output as string | undefined));
          return {
            ...job,
            status: updated.status as VideoJob["status"],
            videoUrl: videoUrl || job.videoUrl,
            error: updated.error,
          };
        });

        setVideoJobs(updatedJobs);
        setScenes(project.scenes.map((scene) => {
          const job = updatedJobs.find((item) => item.sceneId === scene.id && item.status === "succeeded" && item.videoUrl);
          return job ? { ...scene, videoUrl: job.videoUrl } : scene;
        }));
      } catch (error) {
        console.error("[Step7] Video polling error:", error);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isPolling, videoJobs, userSettings?.replicateApiKey, (userSettings as any)?.falApiKey, videoProvider, falVideoModel, utils, project.scenes, setScenes]);

  const buildMotionPrompt = (sceneDesc: string) => {
    const template = MOTION_TYPES[selectedMotion].template;
    // Incorporate Master Prompt guidance into video motion
    const masterPromptGuidance = project.masterPrompt
      ? `[Master Vision: ${project.masterPrompt}] `
      : "";
    return `${masterPromptGuidance}${template.replace("{scene}", sceneDesc)}`;
  };

  const handleCopyOne = (id: number, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Motion prompt copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allPrompts = displayScenes
      .map((s, i) => `Scene ${i + 1}: ${s.lyricLine}\nMOTION: ${buildMotionPrompt(s.sceneDescription)}\nDURATION: ${s.duration}s`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    toast.success(`Copied ${displayScenes.length} motion prompts!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Scene #", "Lyric Line", "Duration (s)", "Motion Prompt"],
      ...displayScenes.map((s, i) => [
        String(i + 1),
        s.lyricLine,
        String(s.duration),
        buildMotionPrompt(s.sceneDescription),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "devotional-video"}-motion-prompts.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  const handleGenerateVideos = async () => {
    const replicateApiKey = userSettings?.replicateApiKey || "";
    const falApiKey = (userSettings as any)?.falApiKey || "";
    const hasFalKey = Boolean(envKeyStatus?.falApiKey || falApiKey);
    const hasReplicateKey = Boolean(envKeyStatus?.replicateApiKey || replicateApiKey);

    if ((videoProvider === "wan" || videoProvider === "kling") && !hasFalKey) {
      toast.error("Add your fal.ai API key in Settings or Railway Variables");
      return;
    }
    if (videoProvider === "replicate" && !hasReplicateKey) {
      toast.error("Add your Replicate API key in Settings or Railway Variables");
      return;
    }

    const candidateScenes = displayScenes.filter((scene) => isHostedUrl(scene.imageUrl) || isInlineImage(scene.imageUrl));
    if (candidateScenes.length === 0) {
      toast.error("Approve or paste images before generating video clips");
      return;
    }

    setGenStatus("submitting");
    setVideoJobs([]);

    try {
      const hostedBySceneId = new Map<number, string>();
      const scenesNeedingUpload = candidateScenes.filter((scene) => !isHostedUrl(scene.imageUrl) && isInlineImage(scene.imageUrl));

      if (scenesNeedingUpload.length > 0) {
        toast.info(`Hosting ${scenesNeedingUpload.length} generated images for video...`);
      }

      for (const scene of candidateScenes) {
        if (isHostedUrl(scene.imageUrl)) {
          hostedBySceneId.set(scene.id, scene.imageUrl!);
          continue;
        }

        if (!scene.imageUrl) continue;
        const blob = await imageValueToBlob(scene.imageUrl);
        const mimeType = blob.type || "image/png";
        const response = await fetch("/api/upload/image", {
          method: "POST",
          headers: { "Content-Type": mimeType },
          body: blob,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Could not host generated image for video");
        }

        const { url } = await response.json();
        hostedBySceneId.set(scene.id, url);
      }

      const hostedScenes = candidateScenes
        .map((scene) => ({ scene, imageUrl: hostedBySceneId.get(scene.id) }))
        .filter((item): item is { scene: typeof candidateScenes[number]; imageUrl: string } => Boolean(item.imageUrl));

      if (videoProvider === "zsky" && hostedScenes.length > 4) {
        throw new Error("ZSky is experimental and limited to 4 clips per batch. Use WAN for full song batches.");
      }

      const scenesWithHostedImages = project.scenes.map((scene) => {
        const hostedUrl = hostedBySceneId.get(scene.id);
        return hostedUrl ? { ...scene, imageUrl: hostedUrl } : scene;
      });

      setScenes(scenesWithHostedImages);

      let jobs: VideoJob[];

      if (videoProvider === "wan" || videoProvider === "kling") {
        const model = videoProvider;
        const result = await generateVideosFalMutation.mutateAsync({
          falApiKey,
          model,
          videos: hostedScenes.map(({ scene, imageUrl }) => ({
            imageUrl,
            motionPrompt: buildMotionPrompt(scene.sceneDescription),
            sceneId: scene.id,
          })),
        });
        if (!result.success || !result.data) {
          throw new Error(result.error || "fal.ai video generation failed to start");
        }
        jobs = result.data.map((job) => ({
          jobId: job.requestId,
          sceneId: job.sceneId,
          status: "starting" as VideoJob["status"],
        }));
        setFalVideoModel(model);
      } else if (videoProvider === "zsky") {
        const result = await generateVideosZskyMutation.mutateAsync({
          videos: hostedScenes.map(({ scene, imageUrl }) => ({
            imageUrl,
            motionPrompt: buildMotionPrompt(scene.sceneDescription),
            sceneId: scene.id,
            duration: Math.max(5, Math.min(10, scene.duration || 5)),
          })),
        });
        if (!result.success || !result.data) {
          throw new Error(result.error || "ZSky video generation failed");
        }
        jobs = result.data.map((job) => ({
          jobId: job.requestId,
          sceneId: job.sceneId,
          status: job.status === "completed" ? "succeeded" : "failed",
          videoUrl: job.videoUrl,
          error: job.error,
        }));
      } else {
        const result = await generateVideosMutation.mutateAsync({
          replicateApiKey,
          videos: hostedScenes.map(({ scene, imageUrl }) => ({
            imageUrl,
            motionPrompt: buildMotionPrompt(scene.sceneDescription),
            duration: Math.max(5, Math.min(30, scene.duration || 6)),
          })),
        });
        if (!result.success || !result.data) {
          throw new Error(result.error || "Video generation failed to start");
        }
        jobs = result.data.map((job, idx) => ({
          jobId: job.id,
          sceneId: hostedScenes[idx].scene.id,
          status: job.status as VideoJob["status"],
          videoUrl: normalizeVideoSrc(Array.isArray(job.output) ? job.output[0] : (job.output as string | undefined)),
          error: job.error,
        }));
      }

      setScenes(scenesWithHostedImages.map((scene) => {
        const job = jobs.find((item) => item.sceneId === scene.id && item.status === "succeeded" && item.videoUrl);
        return job ? { ...scene, videoUrl: job.videoUrl } : scene;
      }));

      setVideoJobs(jobs);
      const hasPendingJobs = jobs.some((job) => job.status === "starting" || job.status === "processing");
      setGenStatus(hasPendingJobs ? "polling" : "done");
      setIsPolling(hasPendingJobs);
      const providerLabel = videoProvider === "wan" ? "WAN 2.1 via fal.ai"
        : videoProvider === "kling" ? "Kling via fal.ai"
        : videoProvider === "zsky" ? "ZSky"
        : "MiniMax via Replicate";
      toast.success(hasPendingJobs ? `Generating ${jobs.length} video clips via ${providerLabel}...` : `${jobs.length} video clips ready via ${providerLabel}`);
    } catch (error) {
      setGenStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to start video generation");
    }
  };

  const handleContinue = () => {
    markStepComplete(5);
    setActiveStep(6);
  };

  if (project.scenes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>Step 5</p>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>Video Prompts</h2>
        </div>
        <div className="text-center py-12 rounded-lg" style={{ border: "2px dashed rgba(255,255,255,0.1)", color: "rgba(236,236,241,0.35)" }}>
          <Video size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please complete Step 3 (Scene Breakdown) first</p>
        </div>
      </div>
    );
  }

  const approvedScenes = project.scenes.filter((s) => s.imageApproved === true);
  const displayScenes = sceneSource === "approved" && approvedScenes.length > 0 ? approvedScenes : project.scenes;
  const totalDuration = displayScenes.reduce((sum, s) => sum + s.duration, 0);
  const usingApprovedScenes = sceneSource === "approved" && approvedScenes.length > 0;
  const readyForVideoCount = displayScenes.filter((scene) => isHostedUrl(scene.imageUrl) || isInlineImage(scene.imageUrl)).length;
  const videoReadyCount = displayScenes.filter((scene) => scene.videoUrl).length;
  const hasFalKey = Boolean(envKeyStatus?.falApiKey || (userSettings as any)?.falApiKey);
  const hasReplicateKey = Boolean(envKeyStatus?.replicateApiKey || userSettings?.replicateApiKey);
  const zskyBatchBlocked = videoProvider === "zsky" && readyForVideoCount > 4;

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>
            Step 7
          </p>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>
            Video Motion Prompts
          </h2>
          <p className="text-sm" style={{ color: "rgba(236,236,241,0.6)" }}>
            Generate motion prompts for Runway, Pika, Kling, or similar tools. Master Prompt guides thematic consistency.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0">
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(236,236,241,0.72)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {displayScenes.length}{approvedScenes.length > 0 ? " approved" : ""} scenes
          </span>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(236,236,241,0.62)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            ~{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} total
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

      {/* Controls card */}
      <div className="space-y-4 p-4" style={panelStyle}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
            Video setup
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
            Choose which scenes to use and the motion style for every video prompt.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span style={labelStyle}>Scene source</span>
            <select
              value={sceneSource}
              onChange={(e) => setSceneSource(e.target.value as "approved" | "all")}
              style={selectStyle}
            >
              <option value="approved">Approved images only, if available</option>
              <option value="all">All scenes</option>
            </select>
          </label>

          <label>
            <span style={labelStyle}>Motion type</span>
            <select
              value={selectedMotion}
              onChange={(e) => setSelectedMotion(Number(e.target.value))}
              style={selectStyle}
            >
              {MOTION_TYPES.map((motion, i) => (
                <option key={motion.id} value={i}>
                  {motion.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="text-xs leading-relaxed p-3 rounded-lg"
          style={{
            background: fieldStyle.background,
            border: fieldStyle.border,
            color: "rgba(255,255,255,0.58)",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.36)" }}>Template: </span>
          {MOTION_TYPES[selectedMotion].template.replace("{scene}", "[scene description]")}
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)" }} />

        {/* Video provider selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "end" }}>
          <div style={{ minWidth: 0 }}>
            <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
              Video Provider
            </label>
            <select
              value={videoProvider}
              onChange={(e) => {
                const value = e.target.value as "wan" | "kling" | "replicate" | "zsky";
                setVideoProvider(value);
                if (value === "wan" || value === "kling") setFalVideoModel(value);
              }}
              style={{ width: "100%", padding: "0.55rem 0.75rem", background: "#222", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.5rem", color: "#ececf1", fontSize: "0.8rem", cursor: "pointer", outline: "none" }}
            >
              <optgroup label="Recommended">
                <option value="wan">WAN 2.1 via fal.ai — best batch default</option>
                <option value="kling">Kling via fal.ai — higher quality</option>
              </optgroup>
              <optgroup label="Experimental">
                <option value="zsky">ZSky — experimental, max 4 clips</option>
              </optgroup>
              <option value="replicate">MiniMax via Replicate (~$0.05/clip)</option>
            </select>
          </div>
          {(videoProvider === "wan" || videoProvider === "kling") && (
            <p style={{ fontSize: "0.72rem", color: "rgba(16,163,127,0.85)", fontWeight: 600, alignSelf: "flex-end", paddingBottom: "0.55rem" }}>
              {hasFalKey ? "✓ fal.ai key ready" : "Add FAL_API_KEY in Railway or Settings"}
            </p>
          )}
          {videoProvider === "zsky" && (
            <p style={{ fontSize: "0.72rem", color: zskyBatchBlocked ? "oklch(0.74 0.16 45)" : "rgba(16,163,127,0.85)", fontWeight: 600, alignSelf: "flex-end", paddingBottom: "0.55rem" }}>
              {zskyBatchBlocked ? "ZSky is limited to 4 clips here. Use WAN for full batches." : "Experimental direct endpoint. R2 storage required."}
            </p>
          )}
          {videoProvider === "replicate" && (
            <p style={{ fontSize: "0.72rem", color: hasReplicateKey ? "rgba(16,163,127,0.85)" : "oklch(0.74 0.16 45)", fontWeight: 600, alignSelf: "flex-end", paddingBottom: "0.55rem" }}>
              {hasReplicateKey ? "✓ Replicate key ready" : "Add REPLICATE_API_KEY in Railway or Settings"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2">
          <button
            onClick={handleGenerateVideos}
            disabled={genStatus === "submitting" || genStatus === "polling" || readyForVideoCount === 0 || zskyBatchBlocked}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold transition-colors col-span-2 sm:col-span-1"
            style={{
              background: readyForVideoCount > 0 && !zskyBatchBlocked ? "linear-gradient(135deg, oklch(0.72 0.12 75), #25f52f)" : "#2a2a2a",
              color: readyForVideoCount > 0 && !zskyBatchBlocked ? "#111111" : "rgba(236,236,241,0.3)",
              border: "1px solid oklch(0.72 0.12 75 / 0.35)",
              cursor: genStatus === "submitting" || genStatus === "polling" || readyForVideoCount === 0 || zskyBatchBlocked ? "not-allowed" : "pointer",
              opacity: genStatus === "submitting" || genStatus === "polling" || readyForVideoCount === 0 || zskyBatchBlocked ? 0.7 : 1,
            }}
          >
            {genStatus === "submitting" || genStatus === "polling" ? <Loader2 size={12} className="animate-spin" /> : <Video size={12} />}
            {genStatus === "submitting" || genStatus === "polling" ? "Generating Clips" : zskyBatchBlocked ? "Use WAN for Batch" : `Generate ${readyForVideoCount} Clips`}
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: copiedAll ? "rgba(255,255,255,0.08)" : "#2a2a2a",
              color: copiedAll ? "rgba(236,236,241,0.82)" : "rgba(236,236,241,0.58)",
              border: `1px solid ${copiedAll ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)"}`,
            }}
          >
            {copiedAll ? <Check size={12} /> : <Copy size={12} />}
            {copiedAll ? "Copied!" : "Copy All"}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.58)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.46)" }}>
          {readyForVideoCount === 0 ? (
            <>
              <AlertCircle size={13} />
              Approve or paste images before generating clips.
            </>
          ) : (
            <>
              <Check size={13} />
              {readyForVideoCount} scenes ready for video · {videoReadyCount} clips generated
            </>
          )}
        </div>
      </div>

      {/* Approved-only notice */}
      {usingApprovedScenes && approvedScenes.length < project.scenes.length && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: "oklch(0.18 0.08 145 / 0.3)", color: "oklch(0.65 0.15 145)", border: "1px solid oklch(0.45 0.12 145 / 0.3)" }}>
          ✓ Showing video prompts for {approvedScenes.length} approved scenes only ({project.scenes.length - approvedScenes.length} rejected scenes skipped)
        </div>
      )}

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
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {displayScenes.map((scene, idx) => (
          <div key={scene.id} className="shrine-panel p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(236,236,241,0.45)" }}
                >
                  {idx + 1}
                </span>
                <span className="text-xs telugu-text truncate max-w-[240px] min-w-0" style={{ color: "rgba(236,236,241,0.58)" }}>
                  {scene.lyricLine || "Scene " + (idx + 1)}
                </span>
                <span className="text-xs" style={{ color: "rgba(236,236,241,0.35)" }}>
                  {scene.duration}s
                </span>
              </div>
              <button
                onClick={() => handleCopyOne(scene.id, buildMotionPrompt(scene.sceneDescription))}
                className="flex items-center justify-center gap-1 text-xs px-2.5 py-1 rounded transition-colors self-start sm:self-auto"
                style={{
                  background: copiedId === scene.id ? "rgba(255,255,255,0.05)" : "#2a2a2a",
                  color: copiedId === scene.id ? "rgba(236,236,241,0.45)" : "rgba(236,236,241,0.45)",
                  border: `1px solid ${copiedId === scene.id ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {copiedId === scene.id ? <Check size={10} /> : <Copy size={10} />}
                {copiedId === scene.id ? "Copied" : "Copy"}
              </button>
            </div>
            {/* Editable motion prompt + AI improve */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <textarea
                value={scene.motionPrompt || buildMotionPrompt(scene.sceneDescription)}
                onChange={(e) => handleUpdateMotionPrompt(scene.id, e.target.value)}
                rows={3}
                className="sanctum-input text-xs"
                style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "0.375rem 0.625rem", resize: "vertical", color: "rgba(236,236,241,0.75)", lineHeight: 1.5 }}
              />
              <button
                onClick={() => handleImproveMotionPrompt(scene.id, scene.motionPrompt || buildMotionPrompt(scene.sceneDescription))}
                disabled={improvingId === scene.id}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all self-start"
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
            {(() => {
              const job = videoJobs.find((item) => item.sceneId === scene.id);
              const videoUrl = normalizeVideoSrc(scene.videoUrl || job?.videoUrl);
              return (
                <div className="mt-3 space-y-2">
                  {job && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
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
                        opacity: 0.85,
                      }}
                    >
                      {job.status === "succeeded" ? <Check size={10} /> :
                       job.status === "failed" ? <AlertCircle size={10} /> :
                       <Loader2 size={10} className="animate-spin" />}
                      {job.status === "succeeded" ? "Clip ready" :
                       job.status === "failed" ? "Clip failed" :
                       "Generating clip..."}
                    </span>
                  )}
                  {videoUrl && (
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full rounded-lg"
                      style={{
                        maxHeight: "260px",
                        background: "#2a2a2a",
                        border: "1px solid oklch(0.72 0.12 75 / 0.18)",
                      }}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))",
          color: "#181818",
        }}
      >
        Continue to CapCut Assembly
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
