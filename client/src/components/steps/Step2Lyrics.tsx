// ============================================================
// DESIGN: "Glassmorphism" — Step 2: Telugu Lyrics & SUNO Style Generator
// Enhanced with separate SUNO style box, auto-generation, and feedback refinement
// ============================================================
import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, LYRICS_TEMPLATES, DeityKey } from "@/lib/studioData";
import {
  ChevronRight, Copy, Check, FileText, Wand2, RefreshCw,
  Save, BookOpen, Music, ChevronDown, X, Trash2, MessageSquare, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const STRUCTURE_GUIDE = `Structure your lyrics as:
[Pallavi] — Main chorus (2–4 lines, repeated)
[Charanam 1] — First verse (4–6 lines)
[Charanam 2] — Second verse (4–6 lines)
[Charanam 3] — Third verse (optional)
[Anupallavi] — Bridge (optional, 2–4 lines)`;

const WRITING_TIPS: Record<DeityKey, string[]> = {
  venkateswara: [
    "Use names: Govinda, Srinivasa, Balaji, Venkatesha, Tirumala Vasa",
    "Reference: Seven hills (Saptagiri), Alipiri steps, Pushkarini lake",
    "Themes: Seeking refuge, divine darshan, removing sins",
    "Emotions: Devotion, surrender, longing for darshan",
  ],
  ganesha: [
    "Use names: Ganapati, Vighneshwara, Lambodara, Ekadanta",
    "Reference: Modak (sweet), mouse vehicle, lotus, broken tusk",
    "Themes: Removing obstacles, new beginnings, wisdom",
    "Emotions: Joy, auspiciousness, celebration",
  ],
  lakshmi: [
    "Use names: Mahalakshmi, Dhanalakshmi, Padmavathi, Kamala",
    "Reference: Pink lotus, gold coins, white elephants, red saree",
    "Themes: Prosperity, abundance, grace, divine mother",
    "Emotions: Reverence, gratitude, seeking blessings",
  ],
  shiva: [
    "Use names: Mahadeva, Shambho, Nataraja, Bholenath, Maheshwara",
    "Reference: Ganga, crescent moon, trident, Nandi, Kailash",
    "Themes: Destruction of ego, cosmic dance, liberation",
    "Emotions: Awe, surrender, mystical devotion",
  ],
};

// ── Theme definitions ──────────────────────────────────────
const THEMES = [
  { key: "deity", label: "Deity / Devotional", icon: "🙏" },
  { key: "love", label: "Love / Romance", icon: "💕" },
  { key: "folk", label: "Folk / Janapadha", icon: "🪘" },
  { key: "mass", label: "Mass / High Energy", icon: "🔥" },
  { key: "classical", label: "Classical / Carnatic", icon: "🎵" },
  { key: "lullaby", label: "Lullaby / Jolapata", icon: "🌙" },
];

export default function Step2Lyrics() {
  const { project, setLyrics, setSunoStyle, setActiveStep, markStepComplete } = useProject();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("deity");
  const [sunoStyleGenerated, setSunoStyleGenerated] = useState(false);
  const [lyricsLength, setLyricsLength] = useState<"short" | "medium" | "long" | "custom">("medium");
  const [customWordCount, setCustomWordCount] = useState(200);
  const [inputMode, setInputMode] = useState<"ai" | "manual">("ai");
  const [sunoFeedback, setSunoFeedback] = useState("");
  const [showSunoFeedback, setShowSunoFeedback] = useState(false);

  // Template management state
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [showSunoTemplates, setShowSunoTemplates] = useState(false);
  const [savePromptName, setSavePromptName] = useState("");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveSunoName, setSaveSunoName] = useState("");
  const [showSaveSuno, setShowSaveSuno] = useState(false);

  // Support both predefined deities and custom deity names
  const deity = DEITIES.find((d) => d.key === project.deity) ||
    (project.deity ? { key: project.deity, name: project.deity, mood: "Custom" } : null);

  const generateLyricsMutation = trpc.generation.generateLyrics.useMutation();
  const refineSunoStyleMutation = trpc.generation.refineSunoStyle.useMutation();

  // Fetch prompt templates based on selected theme
  const { data: promptTemplatesData, refetch: refetchPrompts } = trpc.templates.listPromptTemplates.useQuery(
    { theme: selectedTheme },
    { enabled: !!selectedTheme }
  );

  // Fetch SUNO style templates based on selected theme
  const { data: sunoTemplatesData, refetch: refetchSunoStyles } = trpc.templates.listSunoStyles.useQuery(
    { theme: selectedTheme },
    { enabled: !!selectedTheme }
  );

  // Save prompt template mutation
  const savePromptMutation = trpc.templates.savePromptTemplate.useMutation({
    onSuccess: () => {
      refetchPrompts();
      toast.success("Prompt template saved!");
      setShowSavePrompt(false);
      setSavePromptName("");
    },
    onError: () => toast.error("Failed to save prompt template"),
  });

  // Delete prompt template mutation
  const deletePromptMutation = trpc.templates.deletePromptTemplate.useMutation({
    onSuccess: () => {
      refetchPrompts();
      toast.success("Prompt template deleted");
    },
  });

  // Save SUNO style mutation
  const saveSunoMutation = trpc.templates.saveSunoStyle.useMutation({
    onSuccess: () => {
      refetchSunoStyles();
      toast.success("SUNO style saved!");
      setShowSaveSuno(false);
      setSaveSunoName("");
    },
    onError: () => toast.error("Failed to save SUNO style"),
  });

  // Delete SUNO style mutation
  const deleteSunoMutation = trpc.templates.deleteSunoStyle.useMutation({
    onSuccess: () => {
      refetchSunoStyles();
      toast.success("SUNO style deleted");
    },
  });

  // Combine default + custom templates
  const allPromptTemplates = useMemo(() => {
    if (!promptTemplatesData) return [];
    return [...promptTemplatesData.defaults, ...promptTemplatesData.custom];
  }, [promptTemplatesData]);

  const allSunoTemplates = useMemo(() => {
    if (!sunoTemplatesData) return [];
    return [...sunoTemplatesData.defaults, ...sunoTemplatesData.custom];
  }, [sunoTemplatesData]);

  const getLyricsDuration = () => {
    switch (lyricsLength) {
      case "short": return 2;
      case "medium": return 4;
      case "long": return 6;
      case "custom": return Math.max(2, Math.min(10, Math.round(customWordCount / 50)));
      default: return 4;
    }
  };

  const loadTemplate = () => {
    if (!deity) {
      toast.error("Please select a deity first");
      return;
    }
    const template = LYRICS_TEMPLATES[deity.key as DeityKey];
    if (template) {
      setLyrics(template);
      toast.success("Template loaded — customize it for your song!");
    } else {
      toast.error("No template available for this deity");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(project.lyrics || "");
    setCopied(true);
    toast.success("Lyrics copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPromptTemplate = (prompt: string) => {
    setCustomPrompt(prompt);
    setShowPromptTemplates(false);
    toast.success("Prompt loaded! Click Generate to create lyrics.");
  };

  const handleSelectSunoTemplate = (template: any) => {
    setSunoStyle({
      tempo: template.tempo,
      style: template.style,
      mood: template.mood,
      instruments: Array.isArray(template.instruments) ? template.instruments : [],
      vocals: template.vocals,
    });
    setSunoStyleGenerated(true);
    setShowSunoTemplates(false);
    toast.success("SUNO style loaded!");
  };

  const handleSaveCurrentPrompt = () => {
    if (!savePromptName.trim()) {
      toast.error("Please enter a name for the template");
      return;
    }
    if (!customPrompt.trim()) {
      toast.error("No prompt to save. Enter a custom prompt first.");
      return;
    }
    savePromptMutation.mutate({
      name: savePromptName,
      theme: selectedTheme,
      prompt: customPrompt,
    });
  };

  const handleSaveCurrentSuno = () => {
    if (!saveSunoName.trim()) {
      toast.error("Please enter a name for the SUNO style");
      return;
    }
    if (!project.sunoStyle) {
      toast.error("No SUNO style to save. Generate one first.");
      return;
    }
    saveSunoMutation.mutate({
      name: saveSunoName,
      theme: selectedTheme,
      tempo: project.sunoStyle.tempo,
      style: project.sunoStyle.style,
      mood: project.sunoStyle.mood,
      instruments: project.sunoStyle.instruments,
      vocals: project.sunoStyle.vocals,
    });
  };

  const handleAIGenerate = async () => {
    if (!project.deity || project.deity.trim().length === 0) {
      toast.error("Please select a deity first");
      return;
    }
    if (!deity) {
      toast.error("Deity not found");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateLyricsMutation.mutateAsync({
        deity: project.deity,
        customPrompt: customPrompt || undefined,
        theme: selectedTheme || undefined,
        duration: getLyricsDuration(),
        language: "telugu",
      });

      if (result.success && result.data) {
        setLyrics(result.data.lyrics);

        if (result.data.sunoStyle) {
          setSunoStyle({
            tempo: result.data.sunoStyle.tempo || "medium",
            style: result.data.sunoStyle.style || "Devotional bhajan",
            mood: result.data.sunoStyle.mood || "Meditative & Peaceful",
            instruments: result.data.sunoStyle.instruments || ["Harmonium", "Tabla"],
            vocals: result.data.sunoStyle.vocals || "Male devotional tenor",
          });
          setSunoStyleGenerated(true);
          toast.success("✨ Lyrics and SUNO style generated!");
        } else {
          toast.success("✨ Lyrics generated!");
        }
        setCustomPrompt("");
        setSunoFeedback("");
      } else {
        toast.error(result.error || "Failed to generate lyrics");
      }
    } catch (error) {
      toast.error("AI generation failed. Check your connection.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineSunoStyle = async () => {
    if (!sunoFeedback.trim()) {
      toast.error("Please provide feedback for refinement");
      return;
    }
    if (!project.lyrics) {
      toast.error("Please generate lyrics first");
      return;
    }

    setIsRefining(true);
    try {
      const result = await refineSunoStyleMutation.mutateAsync({
        lyrics: project.lyrics,
        currentStyle: (project.sunoStyle || {}) as any,
        feedback: sunoFeedback,
        theme: selectedTheme,
        deity: project.deity || "General",
      });

      if (result.success && result.data) {
        setSunoStyle({
          tempo: (result.data as any)?.tempo || "medium",
          style: (result.data as any)?.style || "Devotional bhajan",
          mood: (result.data as any)?.mood || "Meditative & Peaceful",
          instruments: (result.data as any)?.instruments || ["Harmonium", "Tabla"],
          vocals: (result.data as any)?.vocals || "Male devotional tenor",
        } as any);
        setSunoStyleGenerated(true);
        toast.success("🎵 SUNO style refined based on your feedback!");
        setSunoFeedback("");
        setShowSunoFeedback(false);
      } else {
        toast.error(result.error || "Failed to refine SUNO style");
      }
    } catch (error) {
      toast.error("Refinement failed. Please try again.");
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleContinue = () => {
    if (project.lyrics && project.lyrics.trim().length > 20) {
      markStepComplete(2);
      setActiveStep(3);
    } else {
      toast.error("Please write or load some lyrics first");
    }
  };

  const handleSkipToAudio = () => {
    if (project.lyrics && project.lyrics.trim().length > 20) {
      markStepComplete(2);
      markStepComplete(3);
      setActiveStep(4);
    } else {
      toast.error("Please write or load some lyrics first");
    }
  };

  const wordCount = project.lyrics ? project.lyrics.trim().split(/\s+/).filter(Boolean).length : 0;
  const lineCount = project.lyrics ? project.lyrics.trim().split("\n").filter(Boolean).length : 0;

  // ── Shared styles ──────────────────────────────────────
  const glassPanel: React.CSSProperties = {
    padding: "1.5rem",
    background: "rgba(0, 212, 255, 0.08)",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "0.75rem",
    backdropFilter: "blur(10px)",
  };

  const sunoPanel: React.CSSProperties = {
    padding: "1.5rem",
    background: "rgba(255, 0, 110, 0.08)",
    border: "1px solid rgba(255, 0, 110, 0.2)",
    borderRadius: "0.75rem",
    backdropFilter: "blur(10px)",
  };

  const greenPanel: React.CSSProperties = {
    padding: "1rem",
    background: "rgba(57, 255, 20, 0.08)",
    border: "1px solid rgba(57, 255, 20, 0.2)",
    borderRadius: "0.5rem",
    backdropFilter: "blur(10px)",
  };

  const smallBtn = (active?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.75rem",
    padding: "0.5rem 0.875rem",
    borderRadius: "0.375rem",
    background: active ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "rgba(0, 212, 255, 0.1)",
    color: active ? "#000" : "#00d4ff",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 200ms",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.15em", marginBottom: "0.5rem", color: "#00d4ff", textTransform: "uppercase" }}>
          Step 2 of 8
        </p>
        <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.75rem", fontFamily: "'Space Grotesk', sans-serif", color: "#00d4ff" }}>
          Write Lyrics & Generate SUNO Style
        </h2>
        <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
          Create or paste lyrics, then auto-generate SUNO style. Refine the style with feedback if needed.
        </p>
      </div>

      {/* Theme Selector */}
      <div>
        <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.75rem", display: "block", textTransform: "uppercase" }}>
          Song Theme
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedTheme(t.key)}
              style={{
                padding: "0.625rem 1.125rem",
                borderRadius: "0.5rem",
                background: selectedTheme === t.key ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "rgba(0, 212, 255, 0.08)",
                color: selectedTheme === t.key ? "#000" : "#00d4ff",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                fontWeight: "600",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 200ms",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Mode Selector */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(0, 212, 255, 0.1)", paddingBottom: "1rem" }}>
        <button
          onClick={() => setInputMode("ai")}
          style={{
            padding: "0.625rem 1.25rem",
            background: inputMode === "ai" ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "transparent",
            color: inputMode === "ai" ? "#000" : "#00d4ff",
            border: `1px solid ${inputMode === "ai" ? "transparent" : "rgba(0, 212, 255, 0.3)"}`,
            borderRadius: "0.375rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 200ms",
            fontSize: "0.875rem",
          }}
        >
          <Wand2 size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
          AI Generate
        </button>
        <button
          onClick={() => setInputMode("manual")}
          style={{
            padding: "0.625rem 1.25rem",
            background: inputMode === "manual" ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "transparent",
            color: inputMode === "manual" ? "#000" : "#00d4ff",
            border: `1px solid ${inputMode === "manual" ? "transparent" : "rgba(0, 212, 255, 0.3)"}`,
            borderRadius: "0.375rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 200ms",
            fontSize: "0.875rem",
          }}
        >
          <FileText size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
          Manual Input
        </button>
      </div>

      {/* Lyrics Length Control (AI Mode) */}
      {inputMode === "ai" && (
        <div style={{ ...glassPanel }}>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.75rem", display: "block", textTransform: "uppercase" }}>
            Lyrics Length
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {(["short", "medium", "long", "custom"] as const).map((len) => (
              <button
                key={len}
                onClick={() => setLyricsLength(len)}
                style={{
                  padding: "0.5rem 1rem",
                  background: lyricsLength === len ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "rgba(0, 212, 255, 0.08)",
                  color: lyricsLength === len ? "#000" : "#00d4ff",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  borderRadius: "0.375rem",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all 200ms",
                  textTransform: "capitalize",
                }}
              >
                {len === "short" && "Short (20-50 words)"}
                {len === "medium" && "Medium (50-100 words)"}
                {len === "long" && "Long (100-200 words)"}
                {len === "custom" && "Custom"}
              </button>
            ))}
          </div>
          {lyricsLength === "custom" && (
            <input
              type="number"
              min="20"
              max="500"
              value={customWordCount}
              onChange={(e) => setCustomWordCount(parseInt(e.target.value) || 100)}
              placeholder="Enter word count"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: "0.375rem",
                color: "#fff",
                fontSize: "0.875rem",
                marginBottom: "0.75rem",
              }}
            />
          )}
        </div>
      )}

      {/* Lyrics Box */}
      <div style={{ ...glassPanel }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase" }}>
            {inputMode === "ai" ? "Generated Lyrics" : "Your Lyrics"}
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {project.lyrics && (
              <button onClick={handleCopy} style={smallBtn()} title="Copy lyrics">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        </div>
        <textarea
          value={project.lyrics || ""}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder={inputMode === "ai" ? "Click 'Generate Lyrics' to create AI lyrics..." : "Paste your lyrics here..."}
          style={{
            width: "100%",
            minHeight: "200px",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: "0.375rem",
            color: "#fff",
            fontSize: "0.875rem",
            fontFamily: "monospace",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
          <span>📝 {wordCount} words</span>
          <span>📄 {lineCount} lines</span>
          <span>⏱️ ~{getLyricsDuration()} min</span>
        </div>
      </div>

      {/* AI Generate Button */}
      {inputMode === "ai" && (
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !project.deity}
          style={{
            padding: "0.875rem 1.5rem",
            background: isGenerating ? "rgba(0, 212, 255, 0.2)" : "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
            color: isGenerating ? "#00d4ff" : "#000",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: isGenerating ? "not-allowed" : "pointer",
            transition: "all 200ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            opacity: isGenerating || !project.deity ? 0.6 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Generate Lyrics & SUNO Style
            </>
          )}
        </button>
      )}

      {/* SUNO Style Box - Separate Container */}
      {sunoStyleGenerated && project.sunoStyle && (
        <div style={{ ...sunoPanel }}>
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

          {/* SUNO Style Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {/* Tempo */}
            <div style={{ ...greenPanel }}>
              <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Tempo
              </label>
              <input
                type="text"
                value={project.sunoStyle.tempo || ""}
                onChange={(e) => setSunoStyle({ ...project.sunoStyle, tempo: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(57, 255, 20, 0.2)",
                  borderRadius: "0.375rem",
                  color: "#39ff14",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              />
            </div>

            {/* Mood */}
            <div style={{ ...greenPanel }}>
              <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Mood
              </label>
              <input
                type="text"
                value={(project.sunoStyle as any)?.mood || ""}
                onChange={(e) => setSunoStyle({ ...project.sunoStyle, mood: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(57, 255, 20, 0.2)",
                  borderRadius: "0.375rem",
                  color: "#39ff14",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              />
            </div>

            {/* Vocals */}
            <div style={{ ...greenPanel }}>
              <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Vocals
              </label>
              <input
                type="text"
                value={(project.sunoStyle as any)?.vocals || ""}
                onChange={(e) => setSunoStyle({ ...project.sunoStyle, vocals: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(57, 255, 20, 0.2)",
                  borderRadius: "0.375rem",
                  color: "#39ff14",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              />
            </div>

            {/* Instruments */}
            <div style={{ ...greenPanel, gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Instruments
              </label>
              <input
                type="text"
                value={Array.isArray((project.sunoStyle as any)?.instruments) ? (project.sunoStyle as any).instruments.join(", ") : ""}
                onChange={(e) => setSunoStyle({ ...project.sunoStyle, instruments: e.target.value.split(",").map(i => i.trim()) })}
                placeholder="e.g., Sitar, Tabla, Flute"
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(57, 255, 20, 0.2)",
                  borderRadius: "0.375rem",
                  color: "#39ff14",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              />
            </div>
          </div>

          {/* Feedback Section */}
          {showSunoFeedback && (
            <div style={{ ...glassPanel, marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.75rem", display: "block", textTransform: "uppercase" }}>
                What would you like to change?
              </label>
              <textarea
                value={sunoFeedback}
                onChange={(e) => setSunoFeedback(e.target.value)}
                placeholder="e.g., Make it more energetic, add more drums, slower tempo, etc."
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
                  background: isRefining ? "rgba(255, 0, 110, 0.2)" : "linear-gradient(135deg, #ff006e 0%, #00d4ff 100%)",
                  color: isRefining ? "#ff006e" : "#000",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontWeight: "700",
                  fontSize: "0.875rem",
                  cursor: isRefining ? "not-allowed" : "pointer",
                  transition: "all 200ms",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  opacity: isRefining || !sunoFeedback.trim() ? 0.6 : 1,
                }}
              >
                {isRefining ? (
                  <>
                    <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Refining...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Refine SUNO Style
                  </>
                )}
              </button>
            </div>
          )}

          {/* Save SUNO Style */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowSaveSuno(!showSaveSuno)}
              style={smallBtn()}
            >
              <Save size={14} />
              Save Style
            </button>
            {showSaveSuno && (
              <div style={{ width: "100%", ...glassPanel }}>
                <input
                  type="text"
                  value={saveSunoName}
                  onChange={(e) => setSaveSunoName(e.target.value)}
                  placeholder="Template name"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    borderRadius: "0.375rem",
                    color: "#fff",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                />
                <button
                  onClick={handleSaveCurrentSuno}
                  disabled={saveSunoMutation.isPending}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    background: "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
                    color: "#000",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  {saveSunoMutation.isPending ? "Saving..." : "Save Template"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!project.lyrics || project.lyrics.trim().length < 20}
        style={{
          padding: "1rem 1.5rem",
          background: !project.lyrics || project.lyrics.trim().length < 20 ? "rgba(0, 212, 255, 0.2)" : "linear-gradient(135deg, #39ff14 0%, #00d4ff 100%)",
          color: !project.lyrics || project.lyrics.trim().length < 20 ? "#00d4ff" : "#000",
          border: "none",
          borderRadius: "0.5rem",
          fontWeight: "700",
          fontSize: "1rem",
          cursor: !project.lyrics || project.lyrics.trim().length < 20 ? "not-allowed" : "pointer",
          transition: "all 200ms",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        Continue to Audio <ChevronRight size={20} />
      </button>
    </div>
  );
}

// Add spin animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
