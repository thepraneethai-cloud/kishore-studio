// ============================================================
// Step 2: Write Lyrics & SUNO Style
// ============================================================

import { useProject } from "@/contexts/ProjectContext";
import { useState, useEffect } from "react";
import { Music, Copy, Zap, RefreshCw, ChevronDown, ChevronUp, Undo2, Sparkles, Wand2 } from "lucide-react";
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

const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const mins = i + 1;
  const label =
    mins <= 2 ? `${mins} min (short)` :
    mins <= 4 ? `${mins} min (standard)` :
    mins <= 6 ? `${mins} min (full)` :
    `${mins} min (extended)`;
  return { value: mins, label };
});

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

const DEITY_SUGGESTIONS = [
  "Venkateswara", "Ganesha", "Lakshmi", "Shiva", "Durga",
  "Saraswati", "Hanuman", "Krishna", "Parvati", "Murugan",
  "Ayyappa", "Brahma", "Vishnu", "Indra", "Govinda",
  "Narayana", "Balaji", "Tirupati", "Srinivasa", "Jagannath",
  "Kashi Vishwanath", "Meenakshi", "Vaishno Devi", "Chamundeshwari",
  "Annapurna", "Kamakshi", "Tripura Sundari", "Subrahmanya",
  "Divine Love", "Protection", "Prosperity", "Wisdom", "Devotion",
  "Gratitude", "Meditation", "Celebration", "Healing", "Peace",
  "Ramayana", "Mahabharata", "Bhagavad Gita", "Upanishads",
];

function normalizeDeityKey(name: string): string {
  const map: Record<string, string> = {
    venkateswara: "venkateswara",
    ganesha: "ganesha",
    lakshmi: "lakshmi",
    shiva: "shiva",
  };
  return map[name.toLowerCase()] ?? name;
}

// ── component ────────────────────────────────────────────────
export default function Step2Lyrics() {
  const { project, setDeity, setTitle, setLyrics, setSunoStyle, setActiveStep, markStepComplete, undoLyrics, canUndoLyrics } = useProject();

  // deity / title state
  const [deityInput,     setDeityInput]     = useState(project.deity || "");
  const [suggestions,    setSuggestions]    = useState<string[]>([]);
  const [showSuggestions,setShowSuggestions]= useState(false);

  // prompt inputs
  const [theme,          setTheme]          = useState("devotion");
  const [duration,       setDuration]       = useState(4);
  const [language,       setLanguage]       = useState<"telugu" | "english">("telugu");
  const [customPrompt,   setCustomPrompt]   = useState("");
  const [llmModel,       setLlmModel]       = useState("gemini-2.5-flash");

  // vision / prompt-generator inputs
  const [visionInput,      setVisionInput]      = useState("");
  const [isVisionDirective, setIsVisionDirective] = useState(false); // true when customPrompt was AI-generated

  // iterate inputs
  const [iterateFeedback, setIterateFeedback] = useState("");
  const [showIterate,     setShowIterate]     = useState(false);

  // suno refine
  const [sunoFeedback,    setSunoFeedback]    = useState("");
  const [showSunoRefine,  setShowSunoRefine]  = useState(false);

  const deity = DEITIES.find((d) => d.key === project.deity);

  useEffect(() => {
    if (deityInput.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      setSuggestions(
        DEITY_SUGGESTIONS.filter((s) => s.toLowerCase().includes(deityInput.toLowerCase())).slice(0, 6)
      );
    }, 250);
    return () => clearTimeout(t);
  }, [deityInput]);

  const handleSelectDeity = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDeityInput(trimmed);
    setDeity(normalizeDeityKey(trimmed));
    setShowSuggestions(false);
    if (!project.title) setTitle(`${trimmed} Devotional Song`);
  };

  // Auto-commit whatever is typed when the input loses focus
  const handleDeityBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
    if (deityInput.trim() && !project.deity) {
      handleSelectDeity(deityInput.trim());
    }
  };

  // Effective deity for handlers — falls back to typed input if not yet committed
  const effectiveDeity = project.deity || deityInput.trim();

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

  const promptGenMutation = trpc.generation.generateLyricsPrompt.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Prompt generation failed");
        return;
      }
      setCustomPrompt(res.data.prompt);
      setIsVisionDirective(true);
      toast.success("Directive ready — review it below, then click Generate Lyrics!");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── handlers ─────────────────────────────────────────────
  const handleGenerate = () => {
    if (!effectiveDeity) {
      toast.error("Please enter a deity or theme above first");
      return;
    }
    // Commit the typed deity to context if it wasn't yet
    if (!project.deity) handleSelectDeity(effectiveDeity);
    const trimmed = customPrompt.trim();
    generateMutation.mutate({
      deity:           effectiveDeity,
      theme,
      duration,
      language,
      llmModel,
      // Vision-generated brief → primary user message; manual text → appendix
      directivePrompt: isVisionDirective && trimmed ? trimmed : undefined,
      customPrompt:    !isVisionDirective && trimmed ? trimmed : undefined,
    });
  };

  const handleIterate = () => {
    if (!iterateFeedback.trim()) {
      toast.error("Please describe what you'd like to change");
      return;
    }
    generateMutation.mutate({
      deity:    effectiveDeity || project.deity!,
      theme,
      duration,
      language,
      llmModel,
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
      currentStyle: project.sunoStyle as unknown as Record<string, unknown>,
      feedback:     sunoFeedback,
      deity:        project.deity ?? undefined,
      theme,
    });
  };

  const isGenerating = generateMutation.isPending;
  const isRefiningSuno = refineSunoMutation.isPending;
  const sunoStyle = project.sunoStyle as unknown as Record<string, unknown> | null;

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
            Step 1
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#00d4ff", margin: "0 0 0.4rem" }}>
            Deity & Lyrics
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Choose your deity or theme, then generate Telugu devotional lyrics and a SUNO music style.
          </p>
        </div>

        {/* ── DEITY & TITLE PANEL ───────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem" }}>
            Deity / Theme
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Deity input */}
            <div style={{ position: "relative" }}>
              <label style={labelStyle}>
                <Sparkles size={11} style={{ display: "inline", marginRight: "0.3rem" }} />
                Deity, Theme, or Mythology
              </label>
              <input
                type="text"
                value={deityInput}
                onChange={(e) => { setDeityInput(e.target.value); setShowSuggestions(true); }}
                onBlur={handleDeityBlur}
                onFocus={() => deityInput.length >= 2 && setShowSuggestions(true)}
                placeholder="e.g., Venkateswara, Ganesha, Divine Love…"
                style={{ ...inputStyle, resize: undefined }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                  background: "#0d1230", border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "0.375rem", marginTop: "2px", overflow: "hidden",
                }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => handleSelectDeity(s)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "0.5rem 0.75rem", background: "none",
                        color: "rgba(255,255,255,0.75)", fontSize: "0.85rem",
                        border: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,255,0.12)"; e.currentTarget.style.color = "#00d4ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Song title */}
            <div>
              <label style={labelStyle}>Song Title</label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={deityInput ? `${deityInput} Devotional Song` : "e.g., Venkateswara Devotional Song"}
                style={{ ...inputStyle, resize: undefined }}
              />
            </div>
          </div>
          {deityInput && !project.deity && (
            <button
              onMouseDown={() => handleSelectDeity(deityInput)}
              style={{ marginTop: "0.6rem", padding: "0.4rem 1rem", background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.35)", borderRadius: "0.375rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
            >
              Use "{deityInput}"
            </button>
          )}
        </div>

        {/* ── VISION PANEL — theme + language + idea → AI prompt ── */}
        {effectiveDeity && (
          <div style={{ ...panel, marginBottom: "1.25rem", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Wand2 size={15} style={{ color: "#8b5cf6" }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8b5cf6", margin: 0 }}>
                Song Idea
              </p>
              <span style={{ fontSize: "0.7rem", color: "rgba(139,92,246,0.55)", fontWeight: 400 }}>
                — pick a theme, describe your vision, and AI writes a detailed lyrics directive
              </span>
            </div>

            {/* Theme pills */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ ...labelStyle, color: "rgba(139,92,246,0.7)" }}>Theme</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    style={{
                      padding: "0.35rem 0.85rem",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 150ms",
                      background: theme === t.value ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.07)",
                      color: theme === t.value ? "#c4b5fd" : "rgba(139,92,246,0.55)",
                      border: `1px solid ${theme === t.value ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.2)"}`,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language toggle */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ ...labelStyle, color: "rgba(139,92,246,0.7)" }}>Language</label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {(["telugu", "english"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: "0.35rem 1rem",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 150ms",
                      background: language === lang ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.07)",
                      color: language === lang ? "#c4b5fd" : "rgba(139,92,246,0.55)",
                      border: `1px solid ${language === lang ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.2)"}`,
                      textTransform: "capitalize",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Idea textarea */}
            <textarea
              value={visionInput}
              onChange={(e) => setVisionInput(e.target.value)}
              rows={3}
              placeholder={`Describe what you want in plain words. Examples:\n• "Vinayaka Chavithi song with modak offerings, include his vehicle Mushika, joyful mood"\n• "Peaceful bhajan about a devotee's first visit to Tirumala, include Alipiri steps"\n• "Powerful Navratri stotram, lion vahana, demon slayer imagery"`}
              style={{ ...inputStyle, fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "0.75rem", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.06)" }}
            />

            <button
              onClick={() => {
                if (!visionInput.trim()) { toast.error("Describe your idea first"); return; }
                if (!project.deity) handleSelectDeity(effectiveDeity);
                promptGenMutation.mutate({ deity: effectiveDeity, userIdea: visionInput, theme, language, llmModel });
              }}
              disabled={promptGenMutation.isPending || !visionInput.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                background: promptGenMutation.isPending ? "rgba(139,92,246,0.15)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: promptGenMutation.isPending ? "rgba(139,92,246,0.5)" : "#fff",
                border: "none", borderRadius: "0.5rem",
                fontWeight: 600, fontSize: "0.875rem",
                cursor: promptGenMutation.isPending || !visionInput.trim() ? "not-allowed" : "pointer",
                opacity: !visionInput.trim() ? 0.5 : 1,
                transition: "all 200ms",
              }}
            >
              {promptGenMutation.isPending
                ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating directive…</>
                : <><Wand2 size={14} /> Generate Prompt with AI</>
              }
            </button>

            {customPrompt && (
              <p style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "#a78bfa", fontStyle: "italic" }}>
                ✓ Directive ready — it's now the primary brief for lyrics generation. Review or edit it in "Custom direction" below.
              </p>
            )}
          </div>
        )}

        {/* ── PROMPT PANEL ──────────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem" }}>
            Generation Settings
          </p>

          {/* Duration + LLM model row */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div>
              <label style={labelStyle}>Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: "0.375rem",
                  color: "#00d4ff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "170px",
                }}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>LLM Model</label>
              <select
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: "0.375rem",
                  color: "#00d4ff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "230px",
                }}
              >
                <optgroup label="Gemini (platform key)">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash — fast · default</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro — most capable</option>
                </optgroup>
                <optgroup label="Gemini (own Gemini key)">
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-2.0-flash-thinking-exp">Gemini 2.0 Flash Thinking</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </optgroup>
                <optgroup label="ChatGPT (own OpenAI key)">
                  <option value="gpt-4o">GPT-4o — powerful</option>
                  <option value="gpt-4o-mini">GPT-4o Mini — fast · cheap</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Custom prompt / vision directive */}
          <div>
            <label style={labelStyle}>
              {customPrompt ? (
                <span style={{ color: "#a78bfa" }}>✓ AI-generated directive (primary brief)</span>
              ) : (
                <>Custom direction <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, textTransform: "none" }}>— optional, or use "Generate Prompt" above</span></>
              )}
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => { setCustomPrompt(e.target.value); setIsVisionDirective(false); }}
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
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {canUndoLyrics && (
                  <button
                    onClick={() => { undoLyrics(); toast.success("Restored previous lyrics"); }}
                    title="Undo — restore previous version"
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", background: "rgba(255,150,50,0.12)", color: "#ff9632", border: "1px solid rgba(255,150,50,0.35)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Undo2 size={12} />
                    Undo
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(project.lyrics, "Lyrics")}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.75rem", background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
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
            onClick={() => { markStepComplete(1); setActiveStep(2); }}
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
