// ============================================================
// DESIGN: "Digital Sanctum" — Step 8: Auto Assembly Kit
// ============================================================
import { useMemo, useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileJson,
  FileText,
  Scissors,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const DEFAULT_TRANSITION_SECONDS = 0.5;

const CAPCUT_EFFECTS = [
  { name: "Warm Glow", use: "On deity close-up shots" },
  { name: "Light Leak", use: "At section transitions" },
  { name: "Particle Dust", use: "Throughout the video" },
  { name: "Soft Focus", use: "On background elements" },
  { name: "Golden Bokeh", use: "On lamp and fire scenes" },
  { name: "Smoke Overlay", use: "On incense/ritual scenes" },
];

const formatTimestamp = (seconds: number, separator: "," | "." = ",") => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const millis = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(wholeSeconds).padStart(2, "0"),
  ].join(":") + `${separator}${String(millis).padStart(3, "0")}`;
};

const downloadTextFile = (contents: string, filename: string, type: string) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const csvCell = (value: string | number | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function Step8CapCut() {
  const { project, setActiveStep, markStepComplete } = useProject();
  const [useApprovedOnly, setUseApprovedOnly] = useState(true);

  const approvedScenes = project.scenes.filter((scene) => scene.imageApproved === true);
  const scenesForAssembly = useMemo(() => {
    if (useApprovedOnly && approvedScenes.length > 0) return approvedScenes;
    return project.scenes;
  }, [approvedScenes, project.scenes, useApprovedOnly]);

  const timeline = useMemo(() => {
    let cursor = 0;
    return scenesForAssembly.map((scene, index) => {
      const duration = Math.max(1, scene.duration || 5);
      const start = cursor;
      const end = start + duration;
      cursor = end;

      const isSectionChange =
        /\[(pallavi|charanam|chorus|verse|bridge|outro|intro)/i.test(scene.lyricLine) ||
        index === 0;

      return {
        scene,
        sceneNumber: index + 1,
        start,
        end,
        duration,
        transition: index === 0 ? "Fade in" : isSectionChange ? "Dip to black" : "Dissolve",
        transitionSeconds: index === 0 ? 0 : DEFAULT_TRANSITION_SECONDS,
        effect:
          scene.shotType === "CU" || scene.shotType === "ECU"
            ? "Warm Glow"
            : scene.cameraMovement === "pan"
              ? "Light Leak"
              : "Particle Dust",
      };
    });
  }, [scenesForAssembly]);

  const totalDuration = timeline.length > 0 ? timeline[timeline.length - 1].end : 0;
  const imageReadyCount = scenesForAssembly.filter((scene) => Boolean(scene.imageUrl)).length;
  const directorReadyCount = scenesForAssembly.filter((scene) => Boolean(scene.directorNote || scene.shotType || scene.cameraMovement)).length;
  const approvedCount = project.scenes.filter((scene) => scene.imageApproved === true).length;

  const readiness = useMemo(() => {
    const checks = [
      { label: "Scenes planned", done: project.scenes.length > 0 },
      { label: "Audio uploaded", done: Boolean(project.audioUrl) },
      { label: "Images attached", done: imageReadyCount === scenesForAssembly.length && scenesForAssembly.length > 0 },
      { label: "Director analysis", done: directorReadyCount === scenesForAssembly.length && scenesForAssembly.length > 0 },
      { label: "YouTube package", done: Boolean(project.youtubeTitle && project.thumbnailPrompt) },
    ];

    const doneCount = checks.filter((check) => check.done).length;
    return {
      checks,
      percent: Math.round((doneCount / checks.length) * 100),
    };
  }, [directorReadyCount, imageReadyCount, project, scenesForAssembly.length]);

  const warnings = useMemo(() => {
    const items: string[] = [];
    if (project.scenes.length === 0) items.push("Generate scenes before building an edit plan.");
    if (approvedCount === 0 && project.scenes.length > 0) items.push("No approved images yet; the kit will use every scene.");
    if (imageReadyCount < scenesForAssembly.length) items.push(`${scenesForAssembly.length - imageReadyCount} scene images are missing.`);
    if (directorReadyCount < scenesForAssembly.length) items.push("Run Director Analysis to improve shot variety and camera movement.");
    if (totalDuration < 30 && timeline.length > 0) items.push("Total timeline is under 30 seconds; YouTube devotional videos usually need more breathing room.");
    return items;
  }, [approvedCount, directorReadyCount, imageReadyCount, project.scenes.length, scenesForAssembly.length, timeline.length, totalDuration]);

  const baseFilename = (project.title || "devotional-video")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "devotional-video";

  const downloadAssemblyJson = () => {
    const payload = {
      title: project.title,
      deity: project.deity,
      totalDurationSeconds: totalDuration,
      resolution: "1920x1080",
      frameRate: 30,
      colorGrade: {
        warmth: 20,
        saturation: 10,
        contrast: 5,
        shadows: -10,
        highlights: 5,
      },
      timeline: timeline.map((item) => ({
        sceneNumber: item.sceneNumber,
        start: formatTimestamp(item.start, "."),
        end: formatTimestamp(item.end, "."),
        durationSeconds: item.duration,
        lyricLine: item.scene.lyricLine,
        imageUrl: item.scene.imageUrl || "",
        shotType: item.scene.shotType || "",
        cameraMovement: item.scene.cameraMovement || "",
        effect: item.effect,
        transition: item.transition,
        transitionSeconds: item.transitionSeconds,
        motionPrompt: item.scene.motionPrompt,
      })),
    };

    downloadTextFile(JSON.stringify(payload, null, 2), `${baseFilename}-assembly-plan.json`, "application/json");
    toast.success("Assembly plan downloaded");
  };

  const downloadShotCsv = () => {
    const rows = [
      ["Scene", "Start", "End", "Duration", "Lyric", "Shot", "Movement", "Transition", "Effect", "Image URL", "Motion Prompt"],
      ...timeline.map((item) => [
        item.sceneNumber,
        formatTimestamp(item.start, "."),
        formatTimestamp(item.end, "."),
        item.duration,
        item.scene.lyricLine,
        item.scene.shotType || "",
        item.scene.cameraMovement || "",
        item.transition,
        item.effect,
        item.scene.imageUrl || "",
        item.scene.motionPrompt,
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    downloadTextFile(csv, `${baseFilename}-edit-shot-list.csv`, "text/csv");
    toast.success("Edit CSV downloaded");
  };

  const downloadSrt = () => {
    const srt = timeline
      .map((item, index) => {
        const lyric = item.scene.lyricLine.replace(/\[[^\]]+\]/g, "").trim() || `Scene ${item.sceneNumber}`;
        return [
          String(index + 1),
          `${formatTimestamp(item.start)} --> ${formatTimestamp(item.end)}`,
          lyric,
        ].join("\n");
      })
      .join("\n\n");

    downloadTextFile(srt, `${baseFilename}-telugu-subtitles.srt`, "text/plain");
    toast.success("Subtitle file downloaded");
  };

  const handleContinue = () => {
    markStepComplete(6);
    setActiveStep(7);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>
            Step 6
          </p>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>
            Auto Assembly Kit
          </h2>
          <p className="text-sm" style={{ color: "rgba(236,236,241,0.6)" }}>
            Generate a ready edit plan, subtitle file, and shot list from your approved scenes.
          </p>
        </div>

        <a
          href="https://www.capcut.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded font-semibold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))",
            color: "#181818",
          }}
        >
          CapCut <ExternalLink size={11} />
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="shrine-panel p-4 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
                Producer Readiness
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(236,236,241,0.4)" }}>
                {timeline.length} scenes · ~{Math.floor(totalDuration / 60)}:{String(Math.round(totalDuration % 60)).padStart(2, "0")} runtime
              </p>
            </div>
            <span className="text-2xl font-bold" style={{ color: readiness.percent >= 80 ? "oklch(0.70 0.14 145)" : "rgba(236,236,241,0.82)" }}>
              {readiness.percent}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${readiness.percent}%`,
                background: readiness.percent >= 80
                  ? "linear-gradient(90deg, oklch(0.60 0.14 145), oklch(0.75 0.14 145))"
                  : "linear-gradient(90deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))",
              }}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {readiness.checks.map((check) => (
              <div key={check.label} className="flex items-center gap-2 text-xs">
                <CheckCircle2
                  size={14}
                  style={{ color: check.done ? "oklch(0.70 0.14 145)" : "rgba(236,236,241,0.3)" }}
                />
                <span style={{ color: check.done ? "rgba(236,236,241,0.72)" : "rgba(236,236,241,0.4)" }}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrine-panel p-4 space-y-3">
          <p className="text-xs font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
            Scene Source
          </p>
          <button
            onClick={() => setUseApprovedOnly((value) => !value)}
            className="w-full text-left p-3 rounded-lg transition-all"
            style={{
              background: useApprovedOnly ? "rgba(255,255,255,0.05)" : "#222222",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
              {useApprovedOnly ? "Approved scenes first" : "Use all scenes"}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(236,236,241,0.4)" }}>
              {approvedCount > 0 ? `${approvedCount} approved of ${project.scenes.length}` : "Approve images in Step 4 for a cleaner edit"}
            </p>
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(236,236,241,0.72)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={downloadAssemblyJson}
          disabled={timeline.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.72)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <FileJson size={16} />
          Assembly JSON
        </button>
        <button
          onClick={downloadShotCsv}
          disabled={timeline.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.72)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <Scissors size={16} />
          Edit CSV
        </button>
        <button
          onClick={downloadSrt}
          disabled={timeline.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#2a2a2a", color: "rgba(236,236,241,0.72)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <FileText size={16} />
          Telugu SRT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 shrine-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "rgba(236,236,241,0.82)" }} />
            <p className="text-xs font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
              Auto Timeline
            </p>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {timeline.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "rgba(236,236,241,0.4)" }}>
                Scene breakdown is needed before the assembly kit can build a timeline.
              </p>
            ) : (
              timeline.map((item) => (
                <div
                  key={item.scene.id}
                  className="grid gap-3 p-3 rounded-lg sm:grid-cols-[72px_1fr_120px]"
                  style={{ background: "#2f2f2f", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: "rgba(236,236,241,0.82)" }}>
                      Scene {item.sceneNumber}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "rgba(236,236,241,0.35)" }}>
                      {formatTimestamp(item.start, ".")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs telugu-text truncate" style={{ color: "rgba(236,236,241,0.72)" }}>
                      {item.scene.lyricLine || "Untitled lyric line"}
                    </p>
                    <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "rgba(236,236,241,0.45)" }}>
                      {item.scene.sceneDescription}
                    </p>
                  </div>
                  <div className="text-[11px] space-y-1" style={{ color: "rgba(236,236,241,0.45)" }}>
                    <div className="flex justify-between gap-2"><span>Duration</span><span>{item.duration}s</span></div>
                    <div className="flex justify-between gap-2"><span>Transition</span><span>{item.transition}</span></div>
                    <div className="flex justify-between gap-2"><span>Effect</span><span>{item.effect}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="shrine-panel p-3 space-y-3">
            <p className="text-xs font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
              Recommended Effects
            </p>
            {CAPCUT_EFFECTS.map((effect) => (
              <div key={effect.name}>
                <p className="text-xs font-medium" style={{ color: "rgba(236,236,241,0.72)" }}>{effect.name}</p>
                <p className="text-xs" style={{ color: "rgba(236,236,241,0.4)" }}>{effect.use}</p>
              </div>
            ))}
          </div>

          <div className="shrine-panel p-3 space-y-2">
            <p className="text-xs font-semibold" style={{ color: "rgba(236,236,241,0.82)" }}>
              Color Grade
            </p>
            <div className="space-y-1.5 text-xs" style={{ color: "rgba(236,236,241,0.52)" }}>
              <div className="flex justify-between"><span>Warmth</span><span style={{ color: "rgba(236,236,241,0.82)" }}>+20</span></div>
              <div className="flex justify-between"><span>Saturation</span><span style={{ color: "rgba(236,236,241,0.82)" }}>+10</span></div>
              <div className="flex justify-between"><span>Contrast</span><span style={{ color: "rgba(236,236,241,0.82)" }}>+5</span></div>
              <div className="flex justify-between"><span>Shadows</span><span style={{ color: "rgba(236,236,241,0.82)" }}>-10</span></div>
              <div className="flex justify-between"><span>Highlights</span><span style={{ color: "rgba(236,236,241,0.82)" }}>+5</span></div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, rgba(236,236,241,0.82), rgba(236,236,241,0.45))",
          color: "#181818",
        }}
      >
        Continue to YouTube Export
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
