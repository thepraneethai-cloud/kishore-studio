// ============================================================
// DESIGN: "Glassmorphism" — Step 3: Audio Upload
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { ChevronRight, Upload, Music, Check, Trash2, Loader } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Step3Audio() {
  const { project: contextProject, setActiveStep, markStepComplete, setAudioUrl: setProjectAudioUrl } = useProject();
  const [uploading, setUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const hasAudio = Boolean(audioFile || audioUrl || contextProject.audioUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an audio file (MP3, WAV, OGG, M4A, or WebM)");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setAudioFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    toast.success(`Audio file selected: ${file.name}`);
  };

  const handleRemoveAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl("");
    toast.success("Audio file removed");
  };

  const uploadAudioMutation = trpc.generation.uploadAudio.useMutation();

  const continueToScenes = () => {
    markStepComplete(2);
    setActiveStep(3);
  };

  const handleContinue = async () => {
    if (!audioFile && !audioUrl && !contextProject.audioUrl) {
      toast.error("Please upload an audio file first");
      return;
    }

    // If audio file exists and hasn't been uploaded yet
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
        } else {
          if (audioUrl) {
            setProjectAudioUrl(audioUrl);
            toast.warning("Audio storage is not configured. Continuing with this browser session's audio.");
            continueToScenes();
          } else {
            toast.error(result.error || "Failed to upload audio");
          }
        }
      } catch (error) {
        if (audioUrl) {
          setProjectAudioUrl(audioUrl);
          toast.warning("Audio storage is not configured. Continuing with this browser session's audio.");
          continueToScenes();
        } else {
          toast.error(error instanceof Error ? error.message : "Upload failed");
        }
      } finally {
        setUploading(false);
      }
    } else {
      // Audio already uploaded or skipped
      continueToScenes();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.15em", marginBottom: "0.5rem", color: "#00d4ff", textTransform: "uppercase" }}>
          Step 2
        </p>
        <h2 style={{ fontSize: "1.875rem", fontWeight: "700", marginBottom: "0.5rem", fontFamily: "'Space Grotesk', sans-serif", color: "#00d4ff" }}>
          Upload Audio
        </h2>
        <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
          Upload the audio file generated from SUNO AI using the lyrics and style from Step 1.
        </p>
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Upload Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Upload Box */}
          <label
            style={{
              padding: "2rem",
              border: "2px dashed rgba(0, 212, 255, 0.3)",
              borderRadius: "0.75rem",
              background: "rgba(0, 212, 255, 0.05)",
              cursor: "pointer",
              transition: "all 200ms",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              textAlign: "center",
              minHeight: "200px",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.6)";
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.3)";
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.05)";
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.3)";
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.05)";
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const input = document.createElement("input");
                input.type = "file";
                input.files = files;
                handleFileSelect({ target: input } as any);
              }
            }}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <Upload size={32} style={{ color: "#00d4ff" }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#00d4ff", marginBottom: "0.25rem" }}>
                Drop audio file here or click to browse
              </p>
              <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                MP3, WAV, OGG, M4A, or WebM (max 50MB)
              </p>
            </div>
          </label>

          {/* File Info */}
          {audioFile && (
            <div style={{ padding: "1rem", background: "rgba(57, 255, 20, 0.08)", border: "1px solid rgba(57, 255, 20, 0.2)", borderRadius: "0.5rem", backdropFilter: "blur(10px)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Music size={16} style={{ color: "#39ff14" }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#39ff14" }}>
                      {audioFile.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveAudio}
                  style={{
                    background: "rgba(255, 0, 110, 0.1)",
                    border: "1px solid rgba(255, 0, 110, 0.3)",
                    borderRadius: "0.375rem",
                    color: "#ff006e",
                    padding: "0.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 200ms",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#39ff14", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={12} />
                Ready to proceed
              </p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Instructions */}
          <div style={{ padding: "1rem", background: "rgba(0, 212, 255, 0.08)", border: "1px solid rgba(0, 212, 255, 0.2)", borderRadius: "0.5rem", backdropFilter: "blur(10px)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#00d4ff", fontFamily: "'Space Grotesk', sans-serif" }}>
              📋 Instructions
            </p>
            <ol style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.8", listStylePosition: "inside", paddingLeft: "0.5rem" }}>
              <li>Go to <span style={{ color: "#00d4ff", fontWeight: "600" }}>SUNO.AI</span></li>
              <li>Paste the lyrics from Step 1</li>
              <li>Use the SUNO style settings from Step 1</li>
              <li>Generate the audio</li>
              <li>Download the MP3 file</li>
              <li>Upload it here</li>
            </ol>
          </div>

          {/* Audio Preview */}
          {audioUrl && (
            <div style={{ padding: "1rem", background: "rgba(255, 0, 110, 0.08)", border: "1px solid rgba(255, 0, 110, 0.2)", borderRadius: "0.5rem", backdropFilter: "blur(10px)" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#ff006e", fontFamily: "'Space Grotesk', sans-serif" }}>
                🎵 Audio Preview
              </p>
              <audio
                controls
                style={{
                  width: "100%",
                  borderRadius: "0.375rem",
                  background: "rgba(0, 0, 0, 0.2)",
                }}
              >
                <source src={audioUrl} type={audioFile?.type} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Tips */}
          <div style={{ padding: "1rem", background: "rgba(57, 255, 20, 0.08)", border: "1px solid rgba(57, 255, 20, 0.2)", borderRadius: "0.5rem", backdropFilter: "blur(10px)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#39ff14", fontFamily: "'Space Grotesk', sans-serif" }}>
              💡 Tips
            </p>
            <ul style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.6", listStylePosition: "inside" }}>
              <li>• Export at highest quality from SUNO</li>
              <li>• Ensure audio is at least 30 seconds</li>
              <li>• Check audio quality before uploading</li>
              <li>• You can re-generate in SUNO if needed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!hasAudio || uploading}
        style={{
          padding: "0.75rem",
          borderRadius: "0.5rem",
          background: !hasAudio || uploading ? "rgba(0, 212, 255, 0.2)" : "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
          color: !hasAudio || uploading ? "rgba(255, 255, 255, 0.4)" : "#000",
          border: "none",
          fontWeight: "600",
          cursor: !hasAudio || uploading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          transition: "all 200ms",
        }}
      >
        {uploading ? (
          <>
            <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
            Uploading...
          </>
        ) : (
          <>
            Continue to Scene Breakdown
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
