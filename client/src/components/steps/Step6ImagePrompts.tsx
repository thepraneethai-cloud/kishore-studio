// ============================================================
// DESIGN: "Digital Sanctum" — Step 6: Bulk Image Prompts
// Supports both copy-for-external-tools and in-app generation via Replicate
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES } from "@/lib/studioData";
import { ChevronRight, Copy, Check, Download, Sparkles, Image, Loader2, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

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
  const { project, setScenes, setActiveStep, markStepComplete } = useProject();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [showNegative, setShowNegative] = useState(false);

  // Generation state
  const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
  const [genStatus, setGenStatus] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [isPolling, setIsPolling] = useState(false);

  const utils = trpc.useUtils();
  const deity = DEITIES.find((d) => d.key === project.deity);

  // Fetch user's Replicate API key from settings
  const { data: userSettings } = trpc.settings.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const replicateApiKey = userSettings?.replicateApiKey || "";

  const generateImagesMutation = trpc.generation.generateImages.useMutation();

  const buildImagePrompt = useCallback((sceneDesc: string) => {
    const styleSuffix = STYLE_SUFFIXES[selectedStyle];
    return `${sceneDesc}. ${styleSuffix}, warm amber and gold lighting from oil lamps, incense smoke, South Indian temple architecture, intricate stone carvings, sacred and divine atmosphere, ultra-detailed, high quality`;
  }, [selectedStyle]);

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
    if (!replicateApiKey) {
      toast.error("Add your Replicate API key in Settings first");
      return;
    }

    setGenStatus("submitting");
    setImageJobs([]);

    try {
      const prompts = project.scenes.map((s) => buildImagePrompt(s.sceneDescription));
      const result = await generateImagesMutation.mutateAsync({
        prompts,
        replicateApiKey,
        model: "flux-dev",
        width: 1024,
        height: 576,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Generation failed to start");
      }

      const jobs: ImageJob[] = result.data.map((job, idx) => ({
        jobId: job.id,
        sceneIdx: idx,
        status: job.status as ImageJob["status"],
        imageUrl: Array.isArray(job.output) ? job.output[0] : (job.output as string | undefined),
      }));

      setImageJobs(jobs);
      setGenStatus("polling");
      setIsPolling(true);
      toast.success(`Generating ${prompts.length} images via Flux Dev...`);
    } catch (error) {
      setGenStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to start generation");
    }
  };

  const handleRegenerateAll = () => {
    const updated = project.scenes.map((scene) => ({
      ...scene,
      imagePrompt: buildImagePrompt(scene.sceneDescription),
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

  const handleContinue = () => {
    markStepComplete(5);
    setActiveStep(6);
  };

  const pendingCount = imageJobs.filter((j) => j.status === "starting" || j.status === "processing").length;
  const doneCount = imageJobs.filter((j) => j.status === "succeeded").length;

  if (project.scenes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>Step 6</p>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>Image Prompts</h2>
        </div>
        <div className="text-center py-12 rounded-lg" style={{ border: "2px dashed oklch(0.28 0.025 58)", color: "oklch(0.45 0.010 60)" }}>
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Please complete Step 4 (Scene Breakdown) first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 6
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          Image Prompts — Bulk Generator
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          {project.scenes.length} image prompts ready. Generate in-app via Flux Dev or copy for Leonardo AI / Midjourney.
        </p>
      </div>

      {/* Style selector + actions */}
      <div className="shrine-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
            Visual Style
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRegenerateAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
            >
              <Sparkles size={11} />
              Restyle All
            </button>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                background: copiedAll ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.22 0.018 52)",
                color: copiedAll ? "oklch(0.72 0.12 75)" : "oklch(0.65 0.015 68)",
                border: `1px solid ${copiedAll ? "oklch(0.72 0.12 75 / 0.5)" : "oklch(0.28 0.025 58)"}`,
              }}
            >
              {copiedAll ? <Check size={11} /> : <Copy size={11} />}
              {copiedAll ? "Copied All!" : "Copy All"}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.015 68)", border: "1px solid oklch(0.28 0.025 58)" }}
            >
              <Download size={11} />
              CSV
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLE_SUFFIXES.map((style, i) => (
            <button
              key={i}
              onClick={() => setSelectedStyle(i)}
              className="text-xs px-2.5 py-1.5 rounded transition-all"
              style={{
                background: selectedStyle === i ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.20 0.016 52)",
                border: selectedStyle === i ? "1px solid oklch(0.72 0.12 75 / 0.6)" : "1px solid oklch(0.25 0.020 55)",
                color: selectedStyle === i ? "oklch(0.80 0.12 78)" : "oklch(0.55 0.012 65)",
              }}
            >
              {style.split(",")[0]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNegative(!showNegative)}
            className="text-xs"
            style={{ color: "oklch(0.50 0.012 65)" }}
          >
            {showNegative ? "▼" : "▶"} Negative prompt
          </button>
          {showNegative && (
            <span className="text-xs" style={{ color: "oklch(0.45 0.010 60)" }}>
              {NEGATIVE_PROMPT}
            </span>
          )}
        </div>
      </div>

      {/* In-app Generation Panel */}
      <div className="shrine-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.80 0.12 78)", fontFamily: "'Cinzel', serif" }}>
              Generate in App
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.012 65)" }}>
              Flux Dev via Replicate — ~$0.01/image
            </p>
          </div>
          {!replicateApiKey ? (
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{ background: "oklch(0.22 0.018 52)", color: "oklch(0.65 0.10 65)", border: "1px solid oklch(0.35 0.07 65)" }}
            >
              <Settings size={11} />
              Add Replicate Key
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
                <><Loader2 size={12} className="animate-spin" /> Starting...</>
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
                    onClick={() => handleCopyOne(scene.id, buildImagePrompt(scene.sceneDescription))}
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

              {/* Generated image preview */}
              {job?.imageUrl && (
                <div className="rounded overflow-hidden" style={{ border: "1px solid oklch(0.28 0.025 58)" }}>
                  <img
                    src={job.imageUrl}
                    alt={`Scene ${idx + 1}`}
                    className="w-full object-cover"
                    style={{ maxHeight: "180px" }}
                  />
                </div>
              )}

              <textarea
                value={buildImagePrompt(scene.sceneDescription)}
                onChange={(e) => handleUpdatePrompt(scene.id, e.target.value)}
                className="sanctum-input text-xs"
                rows={2}
                style={{ padding: "0.375rem 0.625rem", resize: "none" }}
              />
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
          color: "oklch(0.12 0.015 55)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        Continue to Video Prompts
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
