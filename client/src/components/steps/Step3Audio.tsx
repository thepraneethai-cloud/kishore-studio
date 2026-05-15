// ============================================================
// DESIGN: "Digital Sanctum" — Step 2: Audio Upload
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { ChevronRight, Upload, Music, Check, Trash2, Loader, Link } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Step3Audio() {
  const { project: contextProject, setActiveStep, markStepComplete, setAudioUrl: setProjectAudioUrl } = useProject();
  const [uploading, setUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [urlInput, setUrlInput] = useState(contextProject.audioUrl || "");
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const hasAudio = Boolean(audioFile || audioUrl || contextProject.audioUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an audio file (MP3, WAV, OGG, M4A, or WebM)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    toast.success(`Audio file selected: ${file.name}`);
  };

  const handleRemoveAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl("");
  };

  const uploadAudioMutation = trpc.generation.uploadAudio.useMutation();

  const continueToScenes = () => {
    markStepComplete(2);
    setActiveStep(3);
  };

  const handleContinue = async () => {
    if (!audioFile && !audioUrl && !contextProject.audioUrl) {
      toast.error("Please upload an audio file or paste a URL first");
      return;
    }
    if (audioFile && !contextProject.audioUrl) {
      setUploading(true);
      try {
        const buffer = await audioFile.arrayBuffer();
        const result = await uploadAudioMutation.mutateAsync({
          projectId: Number(contextProject.id) || 0,
          audioBuffer: new Uint8Array(buffer),
          fileName: audioFile.name,
          mimeType: audioFile.type,
        });
        if (result.success && result.url) {
          setProjectAudioUrl(result.url);
          toast.success("Audio uploaded successfully!");
          continueToScenes();
        } else if (audioUrl) {
          setProjectAudioUrl(audioUrl);
          toast.warning("Storage not configured — continuing with session audio.");
          continueToScenes();
        } else {
          toast.error(result.error || "Failed to upload audio");
        }
      } catch {
        if (audioUrl) {
          setProjectAudioUrl(audioUrl);
          toast.warning("Storage not configured — continuing with session audio.");
          continueToScenes();
        } else {
          toast.error("Upload failed");
        }
      } finally {
        setUploading(false);
      }
    } else {
      continueToScenes();
    }
  };

  const handleSaveUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { toast.error("Paste a URL first"); return; }
    setProjectAudioUrl(trimmed);
    toast.success("Audio URL saved");
  };

  // ── Shared styles ─────────────────────────────────────────
  const panel = {
    background: "oklch(0.13 0.013 52)",
    border: "1px solid oklch(0.26 0.022 58)",
    borderRadius: "0.75rem",
    padding: "1.25rem",
  } as const;

  const labelStyle = {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "oklch(0.50 0.012 65)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginBottom: "0.4rem",
    display: "block",
  };

  return (
    <div className="space-y-5">
      {/* Header — matches Digital Sanctum pattern */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>
          Step 2
        </p>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>
          Upload Audio
        </h2>
        <p className="text-sm" style={{ color: "rgba(236,236,241,0.6)" }}>
          Upload or link the audio generated from SUNO AI using your lyrics and style from Step 1.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {(["upload", "url"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${tab === t ? "oklch(0.72 0.12 75 / 0.55)" : "oklch(0.26 0.022 58)"}`,
              background: tab === t ? "oklch(0.72 0.12 75 / 0.14)" : "oklch(0.13 0.013 52)",
              color: tab === t ? "oklch(0.80 0.12 78)" : "oklch(0.52 0.012 65)",
            }}
          >
            {t === "upload" ? "Upload file" : "Paste URL"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        /* ── File upload area ───────────────────────── */
        <div style={panel}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              padding: "2rem",
              borderRadius: "0.65rem",
              border: `2px dashed oklch(0.35 0.05 65 / 0.6)`,
              background: "oklch(0.11 0.010 52)",
              cursor: "pointer",
              textAlign: "center",
              minHeight: "160px",
              transition: "all 200ms",
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "oklch(0.72 0.12 75 / 0.8)"; e.currentTarget.style.background = "oklch(0.15 0.018 58)"; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = "oklch(0.35 0.05 65 / 0.6)"; e.currentTarget.style.background = "oklch(0.11 0.010 52)"; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "oklch(0.35 0.05 65 / 0.6)";
              e.currentTarget.style.background = "oklch(0.11 0.010 52)";
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const input = document.createElement("input");
                input.type = "file";
                input.files = files;
                handleFileSelect({ target: input } as any);
              }
            }}
          >
            <input type="file" accept="audio/*" onChange={handleFileSelect} style={{ display: "none" }} />
            <Upload size={28} style={{ color: "oklch(0.68 0.10 75)", opacity: 0.8 }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "oklch(0.75 0.10 75)", marginBottom: "0.25rem" }}>
                Drop audio file here or click to browse
              </p>
              <p style={{ fontSize: "0.75rem", color: "oklch(0.50 0.010 65)" }}>
                MP3, WAV, OGG, M4A, WebM · max 50 MB
              </p>
            </div>
          </label>

          {audioFile && (
            <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", background: "oklch(0.15 0.025 145 / 0.25)", border: "1px solid oklch(0.50 0.12 145 / 0.4)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Music size={16} style={{ color: "oklch(0.72 0.15 145)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "oklch(0.78 0.12 145)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{audioFile.name}</p>
                <p style={{ fontSize: "0.72rem", color: "oklch(0.52 0.010 65)" }}>{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Check size={14} style={{ color: "oklch(0.72 0.15 145)", flexShrink: 0 }} />
              <button
                onClick={handleRemoveAudio}
                style={{ background: "oklch(0.20 0.04 15 / 0.5)", border: "1px solid oklch(0.45 0.12 15 / 0.4)", borderRadius: "0.375rem", color: "oklch(0.65 0.15 15)", padding: "0.35rem", cursor: "pointer", display: "flex", flexShrink: 0 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {audioUrl && (
            <div style={{ marginTop: "1rem" }}>
              <audio controls style={{ width: "100%", borderRadius: "0.375rem" }}>
                <source src={audioUrl} type={audioFile?.type} />
              </audio>
            </div>
          )}
        </div>
      ) : (
        /* ── URL paste area ─────────────────────────── */
        <div style={panel}>
          <label style={labelStyle}>Suno / audio URL</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://cdn1.suno.ai/…mp3  or any direct audio URL"
              style={{
                flex: 1,
                padding: "0.65rem 0.75rem",
                background: "oklch(0.11 0.010 52)",
                border: "1px solid oklch(0.28 0.025 58)",
                borderRadius: "0.5rem",
                color: "oklch(0.85 0.018 75)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            <button
              onClick={handleSaveUrl}
              style={{ padding: "0.65rem 1rem", background: "oklch(0.72 0.12 75 / 0.18)", border: "1px solid oklch(0.72 0.12 75 / 0.45)", borderRadius: "0.5rem", color: "oklch(0.80 0.12 78)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Save URL
            </button>
          </div>
          {contextProject.audioUrl && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "oklch(0.60 0.10 145)" }}>
              ✓ Saved: {contextProject.audioUrl.length > 60 ? contextProject.audioUrl.slice(0, 60) + "…" : contextProject.audioUrl}
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={panel}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "oklch(0.72 0.12 75)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Music size={14} /> How to get your audio
        </p>
        <ol style={{ fontSize: "0.78rem", color: "oklch(0.58 0.012 65)", lineHeight: "1.9", paddingLeft: "1rem", margin: 0 }}>
          <li>Open <strong style={{ color: "oklch(0.72 0.12 75)" }}>SUNO.AI</strong> and create a new song</li>
          <li>Paste the lyrics from Step 1</li>
          <li>Apply the SUNO style settings generated in Step 1</li>
          <li>Generate and download the MP3</li>
          <li>Upload the file above — or paste the Suno URL</li>
        </ol>
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid oklch(0.22 0.018 55)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {["Export at highest quality from SUNO", "Ensure the audio is at least 30 seconds", "You can re-generate in SUNO if needed"].map((tip) => (
            <p key={tip} style={{ fontSize: "0.72rem", color: "oklch(0.50 0.010 65)" }}>· {tip}</p>
          ))}
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={!hasAudio || uploading}
        style={{
          width: "100%",
          padding: "0.875rem",
          borderRadius: "0.65rem",
          background: !hasAudio || uploading
            ? "oklch(0.20 0.015 52)"
            : "linear-gradient(135deg, oklch(0.72 0.12 75) 0%, oklch(0.78 0.17 145) 100%)",
          color: !hasAudio || uploading ? "oklch(0.40 0.010 60)" : "oklch(0.10 0.010 52)",
          border: "none",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: !hasAudio || uploading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          transition: "all 200ms",
        }}
      >
        {uploading
          ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</>
          : <>Continue to Scene Breakdown <ChevronRight size={16} /></>
        }
      </button>

      {!hasAudio && (
        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "oklch(0.42 0.010 60)", marginTop: "-0.5rem" }}>
          Upload a file or save a URL above to continue.
        </p>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
