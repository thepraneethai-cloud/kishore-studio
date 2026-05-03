// ============================================================
// DESIGN: "Digital Sanctum" — Step 2: Write Lyrics & SUNO Style
// Fixed sidebar + scrollable main content area
// ============================================================

import { useProject } from "@/contexts/ProjectContext";
import { useState } from "react";
import { Music, MessageSquare, Copy, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Step2Lyrics() {
  const { project, setLyrics, setSunoStyle, setActiveStep } = useProject();
  const [sunoFeedback, setSunoFeedback] = useState("");
  const [showSunoFeedback, setShowSunoFeedback] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("deity");

  // ============================================================
  // STYLING
  // ============================================================
  const sunoPanel = {
    background: "linear-gradient(135deg, rgba(255, 0, 110, 0.05) 0%, rgba(0, 212, 255, 0.05) 100%)",
    border: "1px solid rgba(255, 0, 110, 0.2)",
    borderRadius: "0.75rem",
    padding: "1.5rem",
    marginTop: "1.5rem",
  };

  const glassPanel = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.5rem",
    padding: "1rem",
    backdropFilter: "blur(10px)",
  };

  // ============================================================
  // GENERATE LYRICS
  // ============================================================
  const handleGenerateLyrics = async () => {
    if (!project.deity) {
      toast.error("Please select a deity first");
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newLyrics = `Oh divine ${project.deity}, guide us through the darkness,
With your eternal wisdom and boundless grace,
We seek your blessings in every moment,
Your light illuminates our path forward.

In devotion we find strength and peace,
Your love flows through our hearts,
We surrender to your divine will,
And trust in your eternal protection.`;

      const newSunoStyle = {
        tempo: "120 BPM",
        mood: "Meditative & Peaceful",
        instruments: ["Harmonium", "Tabla", "Flute"],
        vocals: "Male devotional tenor",
      };

      setLyrics(newLyrics);
      setSunoStyle(newSunoStyle);

      toast.success("✨ Lyrics and SUNO style generated!");
    } catch (error) {
      toast.error("Failed to generate lyrics");
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // REFINE SUNO STYLE WITH FEEDBACK
  // ============================================================
  const handleRefineSunoStyle = async () => {
    if (!project.lyrics) {
      toast.error("Please generate lyrics first");
      return;
    }

    if (!sunoFeedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    setIsRefining(true);
    try {
      // Simulate API call with feedback processing
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Parse feedback to update style
      const feedbackLower = sunoFeedback.toLowerCase();
      const newStyle = { ...project.sunoStyle } as any;

      // Tempo adjustments
      if (feedbackLower.includes("faster") || feedbackLower.includes("energetic")) {
        const match = sunoFeedback.match(/(\d+)\s*bpm/i);
        newStyle.tempo = match ? `${match[1]} BPM` : "140 BPM";
      } else if (feedbackLower.includes("slower") || feedbackLower.includes("peaceful")) {
        const match = sunoFeedback.match(/(\d+)\s*bpm/i);
        newStyle.tempo = match ? `${match[1]} BPM` : "100 BPM";
      }

      // Mood adjustments
      if (feedbackLower.includes("energetic")) {
        newStyle.mood = "Energetic & Uplifting";
      } else if (feedbackLower.includes("spiritual")) {
        newStyle.mood = "Spiritual & Devotional";
      } else if (feedbackLower.includes("peaceful")) {
        newStyle.mood = "Meditative & Peaceful";
      }

      // Instruments adjustments
      if (feedbackLower.includes("add") || feedbackLower.includes("more")) {
        if (feedbackLower.includes("drum")) {
          if (!newStyle.instruments.includes("Drums")) {
            newStyle.instruments = [...newStyle.instruments, "Drums"];
          }
        }
        if (feedbackLower.includes("sitar")) {
          if (!newStyle.instruments.includes("Sitar")) {
            newStyle.instruments = [...newStyle.instruments, "Sitar"];
          }
        }
        if (feedbackLower.includes("flute")) {
          if (!newStyle.instruments.includes("Flute")) {
            newStyle.instruments = [...newStyle.instruments, "Flute"];
          }
        }
        if (feedbackLower.includes("percussion")) {
          if (!newStyle.instruments.includes("Percussion")) {
            newStyle.instruments = [...newStyle.instruments, "Percussion"];
          }
        }
      }

      // Vocals adjustments
      if (feedbackLower.includes("female")) {
        newStyle.vocals = "Female devotional soprano";
      } else if (feedbackLower.includes("male")) {
        newStyle.vocals = "Male devotional tenor";
      }

      setSunoStyle(newStyle);
      toast.success("🎵 SUNO style refined based on your feedback!");
      setSunoFeedback("");
      setShowSunoFeedback(false);
    } catch (error) {
      toast.error("Failed to refine SUNO style");
    } finally {
      setIsRefining(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0e27" }}>
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#00d4ff", margin: "0 0 0.5rem 0" }}>
              Write Lyrics & SUNO Style
            </h1>
            <p style={{ fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
              Generate devotional lyrics and music style for {project.deity || "your deity"}
            </p>
          </div>

          {/* Theme Selection */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>
              Theme
            </label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                disabled
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: "0.375rem",
                color: "#00d4ff",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              <option value="deity">Deity / Devotional</option>
              <option value="love">Divine Love</option>
              <option value="bhakti">Bhakti / Surrender</option>
              <option value="spiritual">Spiritual Journey</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateLyrics}
            disabled={isGenerating}
            style={{
              width: "100%",
              padding: "1rem",
              background: isGenerating ? "rgba(0, 212, 255, 0.3)" : "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "700",
              fontSize: "1rem",
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "2rem",
              transition: "all 200ms",
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚡</span>
                Generating...
              </>
            ) : (
              <>
                <Zap size={20} />
                Generate Lyrics & SUNO Style
              </>
            )}
          </button>

          {/* Lyrics Box */}
          {project.lyrics && (
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.75rem", display: "block", textTransform: "uppercase" }}>
                Generated Lyrics
              </label>
              <textarea
                value={project.lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "1rem",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  borderRadius: "0.5rem",
                  color: "#00d4ff",
                  fontSize: "0.9rem",
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* SUNO Style - Single Copyable Box */}
          {project.sunoStyle && (
            <div style={sunoPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Music size={20} style={{ color: "#ff006e" }} />
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#ff006e", margin: 0 }}>
                    SUNO Music Style
                  </h3>
                </div>
                <button
                  onClick={() => setShowSunoFeedback(!showSunoFeedback)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.875rem",
                    background: "rgba(255, 0, 110, 0.1)",
                    color: "#ff006e",
                    border: "1px solid rgba(255, 0, 110, 0.3)",
                    borderRadius: "0.375rem",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 200ms",
                  }}
                >
                  <MessageSquare size={14} />
                  Refine with Feedback
                </button>
              </div>

              {/* SUNO Style Text Box - Copy Paste Ready */}
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>
                  Copy-Paste to SUNO AI
                </label>
                <textarea
                  value={`Tempo: ${(project.sunoStyle as any)?.tempo || "120 BPM"}
Mood: ${(project.sunoStyle as any)?.mood || "Meditative & Peaceful"}
Instruments: ${Array.isArray((project.sunoStyle as any)?.instruments) ? (project.sunoStyle as any).instruments.join(", ") : "Harmonium, Tabla"}
Vocals: ${(project.sunoStyle as any)?.vocals || "Male devotional tenor"}`}
                  onChange={(e) => {
                    // Parse the textarea content back into structured format
                    const lines = e.target.value.split("\n");
                    const newStyle = { ...project.sunoStyle } as any;
                    lines.forEach(line => {
                      if (line.startsWith("Tempo:")) newStyle.tempo = line.replace("Tempo:", "").trim();
                      if (line.startsWith("Mood:")) newStyle.mood = line.replace("Mood:", "").trim();
                      if (line.startsWith("Instruments:")) newStyle.instruments = line.replace("Instruments:", "").trim().split(",").map(i => i.trim());
                      if (line.startsWith("Vocals:")) newStyle.vocals = line.replace("Vocals:", "").trim();
                    });
                    setSunoStyle(newStyle);
                  }}
                  style={{
                    width: "100%",
                    minHeight: "140px",
                    padding: "1rem",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 0, 110, 0.3)",
                    borderRadius: "0.5rem",
                    color: "#ff006e",
                    fontSize: "0.9rem",
                    fontFamily: "monospace",
                    fontWeight: "600",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={() => {
                    const text = `Tempo: ${(project.sunoStyle as any)?.tempo || "120 BPM"}
Mood: ${(project.sunoStyle as any)?.mood || "Meditative & Peaceful"}
Instruments: ${Array.isArray((project.sunoStyle as any)?.instruments) ? (project.sunoStyle as any).instruments.join(", ") : "Harmonium, Tabla"}
Vocals: ${(project.sunoStyle as any)?.vocals || "Male devotional tenor"}`;
                    navigator.clipboard.writeText(text);
                    toast.success("✨ SUNO style copied to clipboard!");
                  }}
                  style={{
                    position: "absolute",
                    top: "2.5rem",
                    right: "0.75rem",
                    padding: "0.5rem 0.875rem",
                    background: "linear-gradient(135deg, #ff006e 0%, #00d4ff 100%)",
                    color: "#000",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>

              {/* Feedback Section */}
              {showSunoFeedback && (
                <div style={{ ...glassPanel, marginTop: "1rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.75rem", display: "block", textTransform: "uppercase" }}>
                    What would you like to change?
                  </label>
                  <textarea
                    value={sunoFeedback}
                    onChange={(e) => setSunoFeedback(e.target.value)}
                    placeholder="e.g., Make it more energetic, add more drums, slower tempo, use female vocals, etc."
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "0.75rem",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      borderRadius: "0.375rem",
                      color: "#fff",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      marginBottom: "0.75rem",
                    }}
                  />
                  <button
                    onClick={handleRefineSunoStyle}
                    disabled={isRefining || !sunoFeedback.trim()}
                    style={{
                      padding: "0.625rem 1.25rem",
                      background: isRefining || !sunoFeedback.trim() ? "rgba(0, 212, 255, 0.2)" : "linear-gradient(135deg, #ff006e 0%, #00d4ff 100%)",
                      color: isRefining || !sunoFeedback.trim() ? "rgba(255, 255, 255, 0.4)" : "#000",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      cursor: isRefining || !sunoFeedback.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all 200ms",
                    }}
                  >
                    {isRefining ? (
                      <>
                        <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚡</span>
                        Refining...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Refine SUNO Style
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          {project.lyrics && project.sunoStyle && (
            <button
              onClick={() => setActiveStep(3)}
              style={{
                width: "100%",
                padding: "1rem",
                background: "linear-gradient(135deg, #39ff14 0%, #00ff00 100%)",
                color: "#000",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                marginTop: "2rem",
                transition: "all 200ms",
              }}
            >
              Continue to Audio →
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
