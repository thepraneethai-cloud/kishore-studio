// ============================================================
// Step 2: Write Lyrics & SUNO Style
// ============================================================

import { useProject } from "@/contexts/ProjectContext";
import { useState } from "react";
import { Music, Copy, Zap, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DEITIES } from "@/lib/studioData";

const THEME_OPTIONS = [
  { value: "devotion",     label: "Devotion & Surrender" },
  { value: "gratitude",    label: "Gratitude & Praise" },
  { value: "protection",   label: "Protection & Blessings" },
  { value: "pilgrimage",   label: "Pilgrimage & Journey" },
  { value: "celebration",  label: "Celebration & Festival" },
  { value: "meditation",   label: "Meditation & Peace" },
];

const DURATION_OPTIONS = [
  { value: 3, label: "3 min (short)" },
  { value: 4, label: "4 min (standard)" },
  { value: 5, label: "5 min (full)" },
  { value: 7, label: "7 min (extended)" },
];

// ── helpers ──────────────────────────────────────────────────
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied!`),
    () => toast.error("Could not copy — please select and copy manually"),
  );
}

function sunoStyleText(style: Record<string, unknown>) {
  const instruments = Array.isArray(style.instruments)
    ? (style.instruments as string[]).join(", ")
    : String(style.instruments ?? "");
  return [
    style.style     ? `Style: ${style.style}`           : null,
    style.tempo     ? `Tempo: ${style.tempo}`           : null,
    style.mood      ? `Mood: ${style.mood}`             : null,
    instruments     ? `Instruments: ${instruments}`     : null,
    style.vocals    ? `Vocals: ${style.vocals}`         : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ── component ────────────────────────────────────────────────
export default function Step2Lyrics() {
  const { project, setLyrics, setSunoStyle, setActiveStep, markStepComplete } = useProject();

  // prompt inputs
  const [theme,          setTheme]          = useState("devotion");
  const [duration,       setDuration]       = useState(4);
  const [language,       setLanguage]       = useState<"telugu" | "english">("telugu");
  const [customPrompt,   setCustomPrompt]   = useState("");

  // iterate inputs
  const [iterateFeedback, setIterateFeedback] = useState("");
  const [showIterate,     setShowIterate]     = useState(false);

  // suno refine
  const [sunoFeedback,    setSunoFeedback]    = useState("");
  const [showSunoRefine,  setShowSunoRefine]  = useState(false);

  const deity = DEITIES.find((d) => d.key === project.deity);

  // ── tRPC mutations ────────────────────────────────────────
  const generateMutation = trpc.generation.generateLyrics.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Generation failed");
        return;
      }
      setLyrics(res.data.lyrics);
      if (res.data.sunoStyle) setSunoStyle(res.data.sunoStyle);
      setShowIterate(true);
      toast.success("Lyrics generated!");
    },
    onError: (err) => {
      const msg = err.data?.code === "FORBIDDEN"
        ? err.message
        : "Generation failed — check your API key in Settings";
      toast.error(msg);
    },
  });

  const refineSunoMutation = trpc.generation.refineSunoStyle.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Refine failed");
        return;
      }
      setSunoStyle(res.data as Record<string, unknown>);
      setSunoFeedback("");
      setShowSunoRefine(false);
      toast.success("SUNO style updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── handlers ─────────────────────────────────────────────
  const handleGenerate = () => {
    if (!project.deity) {
      toast.error("Please select a deity in Step 1 first");
      return;
    }
    generateMutation.mutate({
      deity:        project.deity,
      theme,
      duration,
      language,
      customPrompt: customPrompt.trim() || undefined,
    });
  };

  const handleIterate = () => {
    if (!iterateFeedback.trim()) {
      toast.error("Please describe what you'd like to change");
      return;
    }
    generateMutation.mutate({
      deity:    project.deity!,
      theme,
      duration,
      language,
      customPrompt: `Current lyrics for reference:\n${project.lyrics}\n\nUser wants these changes: ${iterateFeedback}\n\nRegenerate the lyrics incorporating these changes while keeping devotional authenticity.`,
    });
    setIterateFeedback("");
  };

  const handleRefineSuno = () => {
    if (!sunoFeedback.trim()) {
      toast.error("Please describe what you'd like to change");
      return;
    }
    refineSunoMutation.mutate({
      lyrics:       project.lyrics,
      currentStyle: project.sunoStyle as Record<string, unknown>,
      feedback:     sunoFeedback,
      deity:        project.deity ?? undefined,
      theme,
    });
  };

  const isGenerating = generateMutation.isPending;
  const isRefiningSuno = refineSunoMutation.isPending;
  const sunoStyle = project.sunoStyle as Record<string, unknown> | null;

  // ── styles ────────────────────────────────────────────────
  const panel = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "0.75rem",
    padding: "1.25rem",
  } as const;

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(0,212,255,0.2)",
    borderRadius: "0.375rem",
    color: "#fff",
    fontSize: "0.9rem",
    resize: "vertical" as const,
    outline: "none",
  };

  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "block" as const,
    marginBottom: "0.4rem",
  };

  const primaryBtn = (loading: boolean) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    background: loading
      ? "rgba(0,212,255,0.25)"
      : "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
    color: loading ? "rgba(255,255,255,0.4)" : "#000",
    border: "none",
    borderRadius: "0.5rem",
    fontWeight: "700" as const,
    fontSize: "0.95rem",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
    transition: "all 200ms",
  } as const);

  const secondaryBtn = (loading: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.625rem 1.125rem",
    background: "rgba(255,0,110,0.1)",
    color: "#ff006e",
    border: "1px solid rgba(255,0,110,0.35)",
    borderRadius: "0.375rem",
    fontWeight: "600" as const,
    fontSize: "0.8rem",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    transition: "all 200ms",
  } as const);

  // ── render ────────────────────────────────────────────────
  return (
    <div style={{ background: "#0a0e27", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(0,212,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Step 2
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#00d4ff", margin: "0 0 0.4rem" }}>
            Write Lyrics
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Generate Telugu devotional lyrics for{" "}
            <span style={{ color: "#00d4ff" }}>{deity?.name ?? project.deity ?? "your deity"}</span>
            {" "}and get a ready-to-paste SUNO music style.
          </p>
        </div>

        {/* ── PROMPT PANEL ──────────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem" }}>
            Generation Settings
          </p>

          {/* Row: theme / duration / language */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={labelStyle}>Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ ...inputStyle, resize: undefined }}>
                {THEME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value} style={{ background: "#0a0e27" }}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ ...inputStyle, resize: undefined }}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value} style={{ background: "#0a0e27" }}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Language</label>
              <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.15rem" }}>
                {(["telugu", "english"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      flex: 1,
                      padding: "0.72rem 0",
                      background: language === lang ? "rgba(0,212,255,0.2)" : "rgba(0,0,0,0.3)",
                      color: language === lang ? "#00d4ff" : "rgba(255,255,255,0.45)",
                      border: `1px solid ${language === lang ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "0.375rem",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom prompt */}
          <div>
            <label style={labelStyle}>
              Custom direction{" "}
              <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, textTransform: "none" }}>
                — optional but powerful
              </span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              placeholder={`Tell the AI what you want. Examples:\n• "Focus on Govinda's seven hills and Alipiri pilgrimage"\n• "Include the phrase 'Govinda Govinda' as the main refrain"\n• "Write in the style of Annamacharya, classical Telugu"`}
              style={{ ...inputStyle, lineHeight: "1.5", fontSize: "0.875rem" }}
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{ ...primaryBtn(isGenerating), width: "100%", marginBottom: "1.75rem" }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
              Generating lyrics…
            </>
          ) : (
            <>
              <Zap size={18} />
              {project.lyrics ? "Regenerate from Scratch" : "Generate Lyrics & SUNO Style"}
            </>
          )}
        </button>

        {/* ── GENERATED LYRICS ─────────────────────────── */}
        {project.lyrics && (
          <div style={{ ...panel, marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", margin: 0 }}>
                Generated Lyrics
              </p>
              <button
                onClick={() => copyToClipboard(project.lyrics, "Lyrics")}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              >
                <Copy size={12} />
                Copy
              </button>
            </div>
            <textarea
              value={project.lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={14}
              style={{
                ...inputStyle,
                color: "#a8d8ea",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                lineHeight: "1.7",
                minHeight: "260px",
              }}
            />

            {/* ── ITERATE SECTION ───────────────────────── */}
            <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1rem" }}>
              <button
                onClick={() => setShowIterate(!showIterate)}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600, padding: 0 }}
              >
                {showIterate ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Not quite right? Iterate with feedback
              </button>

              {showIterate && (
                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>
                    What would you like to change?
                  </label>
                  <textarea
                    value={iterateFeedback}
                    onChange={(e) => setIterateFeedback(e.target.value)}
                    rows={3}
                    placeholder={`Describe what to change. Examples:\n• "Make the Pallavi shorter and more catchy"\n• "Add a reference to Tirumala's golden gopuram"\n• "The Charanam feels too long — trim it"\n• "Switch to a more classical Annamacharya style"`}
                    style={{ ...inputStyle, fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "0.75rem" }}
                  />
                  <button
                    onClick={handleIterate}
                    disabled={isGenerating || !iterateFeedback.trim()}
                    style={{
                      ...secondaryBtn(isGenerating || !iterateFeedback.trim()),
                      background: isGenerating || !iterateFeedback.trim() ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.15)",
                      color: isGenerating || !iterateFeedback.trim() ? "rgba(0,212,255,0.35)" : "#00d4ff",
                      border: `1px solid ${isGenerating || !iterateFeedback.trim() ? "rgba(0,212,255,0.1)" : "rgba(0,212,255,0.4)"}`,
                    }}
                  >
                    {isGenerating ? (
                      <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Regenerating…</>
                    ) : (
                      <><RefreshCw size={14} /> Regenerate with Changes</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUNO STYLE ───────────────────────────────── */}
        {sunoStyle && (
          <div style={{
            ...panel,
            background: "linear-gradient(135deg, rgba(255,0,110,0.06) 0%, rgba(0,212,255,0.06) 100%)",
            border: "1px solid rgba(255,0,110,0.22)",
            marginBottom: "1.75rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Music size={17} style={{ color: "#ff006e" }} />
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ff006e", margin: 0 }}>SUNO Music Style</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => copyToClipboard(sunoStyleText(sunoStyle), "SUNO style")}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", background: "rgba(255,0,110,0.1)", color: "#ff006e", border: "1px solid rgba(255,0,110,0.3)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Copy size={12} />
                  Copy for SUNO
                </button>
                <button
                  onClick={() => setShowSunoRefine(!showSunoRefine)}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  {showSunoRefine ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Refine Style
                </button>
              </div>
            </div>

            {/* Style readout */}
            <pre style={{
              margin: 0,
              padding: "0.875rem",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,0,110,0.2)",
              borderRadius: "0.375rem",
              color: "#ff006e",
              fontSize: "0.875rem",
              fontFamily: "monospace",
              fontWeight: 600,
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {sunoStyleText(sunoStyle)}
            </pre>

            {/* Refine SUNO style */}
            {showSunoRefine && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,0,110,0.15)" }}>
                <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>
                  What would you like to change in the music style?
                </label>
                <textarea
                  value={sunoFeedback}
                  onChange={(e) => setSunoFeedback(e.target.value)}
                  rows={2}
                  placeholder="e.g., slower tempo, add nadaswaram, female vocals, more classical Carnatic feel"
                  style={{ ...inputStyle, fontSize: "0.875rem", marginBottom: "0.75rem" }}
                />
                <button
                  onClick={handleRefineSuno}
                  disabled={isRefiningSuno || !sunoFeedback.trim()}
                  style={secondaryBtn(isRefiningSuno || !sunoFeedback.trim())}
                >
                  {isRefiningSuno ? (
                    <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Refining…</>
                  ) : (
                    <><Zap size={13} /> Apply Changes</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Continue */}
        {project.lyrics && (
          <button
            onClick={() => { markStepComplete(2); setActiveStep(3); }}
            style={{
              width: "100%",
              padding: "1rem",
              background: "linear-gradient(135deg, #39ff14 0%, #00cc00 100%)",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 200ms",
            }}
          >
            Continue to Audio Upload →
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #0a0e27; }
      `}</style>
    </div>
  );
}
