// ============================================================
// DESIGN: "Glassmorphism" — Step 2: Telugu Lyrics & SUNO Style Generator
// With theme-based prompt templates, saveable prompts, and SUNO style templates
// ============================================================
import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, LYRICS_TEMPLATES, DeityKey } from "@/lib/studioData";
import {
  ChevronRight, Copy, Check, FileText, Wand2, RefreshCw,
  Save, BookOpen, Music, ChevronDown, X, Trash2
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
  { key: "deity", label: "Deity / Devotional", icon: "\uD83D\uDE4F" },
  { key: "love", label: "Love / Romance", icon: "\uD83D\uDC95" },
  { key: "folk", label: "Folk / Janapadha", icon: "\uD83E\uDE98" },
  { key: "mass", label: "Mass / High Energy", icon: "\uD83D\uDD25" },
  { key: "classical", label: "Classical / Carnatic", icon: "\uD83C\uDFB5" },
  { key: "lullaby", label: "Lullaby / Jolapata", icon: "\uD83C\uDF19" },
];

export default function Step2Lyrics() {
  const { project, setLyrics, setSunoStyle, setActiveStep, markStepComplete } = useProject();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("deity");
  const [sunoStyleGenerated, setSunoStyleGenerated] = useState(false);
  const [lyricsLength, setLyricsLength] = useState<"short" | "medium" | "long" | "custom">("medium");
  const [customWordCount, setCustomWordCount] = useState(200);
  const [inputMode, setInputMode] = useState<"ai" | "manual">("ai");

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
          toast.success("Lyrics and SUNO style generated by AI!");
        } else {
          toast.success("Lyrics generated by AI!");
        }
        setCustomPrompt("");
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
    padding: "1rem",
    background: "rgba(0, 212, 255, 0.08)",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "0.5rem",
    backdropFilter: "blur(10px)",
  };

  const greenPanel: React.CSSProperties = {
    padding: "1rem",
    background: "rgba(57, 255, 20, 0.08)",
    border: "1px solid rgba(57, 255, 20, 0.2)",
    borderRadius: "0.5rem",
    backdropFilter: "blur(10px)",
  };

  const pinkPanel: React.CSSProperties = {
    padding: "1rem",
    background: "rgba(255, 0, 110, 0.08)",
    border: "1px solid rgba(255, 0, 110, 0.2)",
    borderRadius: "0.5rem",
    backdropFilter: "blur(10px)",
  };

  const smallBtn = (active?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.7rem",
    padding: "0.4rem 0.75rem",
    borderRadius: "0.375rem",
    background: active ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "rgba(0, 212, 255, 0.1)",
    color: active ? "#000" : "#00d4ff",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 200ms",
  });

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 50,
    marginTop: "0.25rem",
    maxHeight: "300px",
    overflowY: "auto",
    background: "rgba(10, 10, 30, 0.95)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "0.5rem",
    backdropFilter: "blur(20px)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.15em", marginBottom: "0.5rem", color: "#00d4ff", textTransform: "uppercase" }}>
          Step 2
        </p>
        <h2 style={{ fontSize: "1.875rem", fontWeight: "700", marginBottom: "0.5rem", fontFamily: "'Space Grotesk', sans-serif", color: "#00d4ff" }}>
          Write Telugu Lyrics & SUNO Style
        </h2>
        <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
          Choose a theme, select a prompt template, and generate lyrics with SUNO style.
        </p>
      </div>

      {/* Theme Selector */}
      <div>
        <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)", marginBottom: "0.5rem", display: "block" }}>
          Song Theme
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedTheme(t.key)}
              style={{
                padding: "0.5rem 1rem",
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
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => setInputMode("ai")}
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "0.5rem",
            background: inputMode === "ai" ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "rgba(0, 212, 255, 0.1)",
            color: inputMode === "ai" ? "#000" : "#00d4ff",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            fontWeight: "600",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 200ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <Wand2 size={16} />
          AI Generate
        </button>
        <button
          onClick={() => setInputMode("manual")}
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "0.5rem",
            background: inputMode === "manual" ? "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)" : "rgba(0, 212, 255, 0.1)",
            color: inputMode === "manual" ? "#000" : "#00d4ff",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            fontWeight: "600",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 200ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <FileText size={16} />
          Manual Input
        </button>
      </div>

      {/* Two-column layout: editor + options */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Left: Lyrics Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Editor toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#00d4ff", fontFamily: "'Space Grotesk', sans-serif" }}>
              Lyrics Editor
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {inputMode === "ai" && (
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !deity}
                  style={{
                    ...smallBtn(true),
                    opacity: isGenerating || !deity ? 0.6 : 1,
                  }}
                >
                  <Wand2 size={12} style={{ animation: isGenerating ? "spin 1s linear infinite" : "none" }} />
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              )}
              <button onClick={loadTemplate} style={smallBtn()}>
                <FileText size={12} />
                Template
              </button>
              <button onClick={handleCopy} style={smallBtn()}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={project.lyrics || ""}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={`Write your Telugu devotional lyrics here...\n\n[Pallavi]\n\u0C17\u0C4B\u0C35\u0C3F\u0C02\u0C26 \u0C17\u0C4B\u0C35\u0C3F\u0C02\u0C26...\n\n[Charanam 1]\n...`}
            style={{
              minHeight: "360px",
              padding: "1rem",
              background: "rgba(0, 212, 255, 0.05)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "0.5rem",
              color: "#fff",
              fontSize: "0.875rem",
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
            }}
          />

          {/* Word count */}
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
            <span>{wordCount} words</span>
            <span>{lineCount} lines</span>
            <span>~{Math.max(1, Math.round(wordCount / 40))} min read</span>
          </div>

          {/* SUNO Style Display */}
          {sunoStyleGenerated && project.sunoStyle && (
            <div style={greenPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#39ff14", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Generated SUNO Style
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setShowSaveSuno(true)}
                    style={smallBtn()}
                  >
                    <Save size={12} />
                    Save Style
                  </button>
                </div>
              </div>

              {/* Save SUNO dialog */}
              {showSaveSuno && (
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    value={saveSunoName}
                    onChange={(e) => setSaveSunoName(e.target.value)}
                    placeholder="Style name (e.g., My Bhajan Style)"
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.75rem",
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      borderRadius: "0.375rem",
                      color: "#fff",
                      fontSize: "0.75rem",
                    }}
                  />
                  <button onClick={handleSaveCurrentSuno} style={smallBtn(true)}>
                    <Check size={12} /> Save
                  </button>
                  <button onClick={() => setShowSaveSuno(false)} style={smallBtn()}>
                    <X size={12} />
                  </button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.75rem" }}>
                <div>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Tempo</p>
                  <p style={{ color: "#39ff14", fontWeight: "600" }}>{project.sunoStyle.tempo}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Mood</p>
                  <p style={{ color: "#39ff14", fontWeight: "600" }}>{project.sunoStyle.mood}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Vocals</p>
                  <p style={{ color: "#39ff14", fontWeight: "600" }}>{project.sunoStyle.vocals}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Instruments</p>
                  <p style={{ color: "#39ff14", fontWeight: "600" }}>
                    {Array.isArray(project.sunoStyle.instruments) ? project.sunoStyle.instruments.join(", ") : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Options Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {inputMode === "ai" && (
            <>
              {/* Prompt Template Selector */}
              <div style={{ ...glassPanel, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#ff006e", fontFamily: "'Space Grotesk', sans-serif" }}>
                    <BookOpen size={12} style={{ display: "inline", marginRight: "0.25rem" }} />
                    Prompt Templates
                  </p>
                  <button
                    onClick={() => setShowPromptTemplates(!showPromptTemplates)}
                    style={smallBtn()}
                  >
                    <ChevronDown size={12} style={{ transform: showPromptTemplates ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                    {showPromptTemplates ? "Close" : "Browse"}
                  </button>
                </div>

                {/* Prompt template dropdown */}
                {showPromptTemplates && (
                  <div style={dropdownStyle}>
                    {allPromptTemplates.length === 0 ? (
                      <div style={{ padding: "1rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem" }}>
                        No templates for this theme yet
                      </div>
                    ) : (
                      allPromptTemplates.map((t: any) => (
                        <div
                          key={t.id}
                          style={{
                            padding: "0.75rem",
                            borderBottom: "1px solid rgba(0, 212, 255, 0.1)",
                            cursor: "pointer",
                            transition: "background 200ms",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div onClick={() => handleSelectPromptTemplate(t.prompt)} style={{ flex: 1 }}>
                              <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#00d4ff", marginBottom: "0.25rem" }}>
                                {t.name}
                                {t.isDefault ? (
                                  <span style={{ fontSize: "0.6rem", marginLeft: "0.5rem", color: "rgba(255, 255, 255, 0.4)" }}>DEFAULT</span>
                                ) : null}
                              </p>
                              <p style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)", lineHeight: "1.4" }}>
                                {t.prompt.length > 100 ? t.prompt.substring(0, 100) + "..." : t.prompt}
                              </p>
                            </div>
                            {!t.isDefault && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePromptMutation.mutate({ id: t.id });
                                }}
                                style={{ padding: "0.25rem", color: "#ff006e", background: "none", border: "none", cursor: "pointer" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Custom prompt input */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)" }}>
                    Custom Prompt
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Write a devotional bhajan with Pallavi and 2 Charanams..."
                    rows={3}
                    style={{
                      padding: "0.5rem",
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      borderRadius: "0.375rem",
                      color: "#fff",
                      fontSize: "0.75rem",
                      resize: "vertical",
                    }}
                  />
                  {customPrompt.trim() && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => setShowSavePrompt(true)} style={smallBtn()}>
                        <Save size={10} /> Save Prompt
                      </button>
                    </div>
                  )}
                </div>

                {/* Save prompt dialog */}
                {showSavePrompt && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <input
                      type="text"
                      value={savePromptName}
                      onChange={(e) => setSavePromptName(e.target.value)}
                      placeholder="Template name..."
                      style={{
                        flex: 1,
                        padding: "0.4rem 0.75rem",
                        background: "rgba(0, 212, 255, 0.05)",
                        border: "1px solid rgba(0, 212, 255, 0.2)",
                        borderRadius: "0.375rem",
                        color: "#fff",
                        fontSize: "0.75rem",
                      }}
                    />
                    <button onClick={handleSaveCurrentPrompt} style={smallBtn(true)}>
                      <Check size={12} />
                    </button>
                    <button onClick={() => setShowSavePrompt(false)} style={smallBtn()}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* SUNO Style Templates */}
              <div style={{ ...pinkPanel, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#ff006e", fontFamily: "'Space Grotesk', sans-serif" }}>
                    <Music size={12} style={{ display: "inline", marginRight: "0.25rem" }} />
                    SUNO Style Templates
                  </p>
                  <button
                    onClick={() => setShowSunoTemplates(!showSunoTemplates)}
                    style={smallBtn()}
                  >
                    <ChevronDown size={12} style={{ transform: showSunoTemplates ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                    {showSunoTemplates ? "Close" : "Browse"}
                  </button>
                </div>

                {/* SUNO template dropdown */}
                {showSunoTemplates && (
                  <div style={dropdownStyle}>
                    {allSunoTemplates.length === 0 ? (
                      <div style={{ padding: "1rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem" }}>
                        No SUNO styles for this theme yet
                      </div>
                    ) : (
                      allSunoTemplates.map((s: any) => (
                        <div
                          key={s.id}
                          style={{
                            padding: "0.75rem",
                            borderBottom: "1px solid rgba(0, 212, 255, 0.1)",
                            cursor: "pointer",
                            transition: "background 200ms",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 0, 110, 0.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div onClick={() => handleSelectSunoTemplate(s)} style={{ flex: 1 }}>
                              <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#ff006e", marginBottom: "0.25rem" }}>
                                {s.name}
                                {s.isDefault ? (
                                  <span style={{ fontSize: "0.6rem", marginLeft: "0.5rem", color: "rgba(255, 255, 255, 0.4)" }}>DEFAULT</span>
                                ) : null}
                              </p>
                              <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.5)" }}>
                                <span>Tempo: {s.tempo}</span>
                                <span>Mood: {s.mood}</span>
                              </div>
                              <p style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "0.25rem" }}>
                                {Array.isArray(s.instruments) ? s.instruments.join(", ") : ""}
                              </p>
                            </div>
                            {!s.isDefault && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSunoMutation.mutate({ id: s.id });
                                }}
                                style={{ padding: "0.25rem", color: "#ff006e", background: "none", border: "none", cursor: "pointer" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* AI Options */}
              <div style={glassPanel}>
                <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#39ff14", fontFamily: "'Space Grotesk', sans-serif" }}>
                  AI Options
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)" }}>
                      Lyrics Length
                    </label>
                    <select
                      value={lyricsLength}
                      onChange={(e) => setLyricsLength(e.target.value as any)}
                      style={{
                        padding: "0.5rem",
                        background: "rgba(0, 212, 255, 0.05)",
                        border: "1px solid rgba(0, 212, 255, 0.2)",
                        borderRadius: "0.375rem",
                        color: "#fff",
                        fontSize: "0.75rem",
                      }}
                    >
                      <option value="short">Short (2 min)</option>
                      <option value="medium">Medium (4 min)</option>
                      <option value="long">Long (6 min)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {lyricsLength === "custom" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.7rem", fontWeight: "600", color: "rgba(255, 255, 255, 0.6)" }}>
                        Word Count: {customWordCount}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={customWordCount}
                        onChange={(e) => setCustomWordCount(parseInt(e.target.value))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Deity Tips */}
              {deity && WRITING_TIPS[deity.key as DeityKey] && (
                <div style={pinkPanel}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#ff006e", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {deity.name} Tips
                  </p>
                  <ul style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.6", listStylePosition: "inside" }}>
                    {WRITING_TIPS[deity.key as DeityKey].map((tip, i) => (
                      <li key={i} style={{ marginBottom: "0.5rem" }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {inputMode === "manual" && (
            <>
              {/* Structure guide */}
              <div style={glassPanel}>
                <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#00d4ff", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Song Structure
                </p>
                <pre
                  style={{
                    fontSize: "0.7rem",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontFamily: "'Inter', monospace",
                  }}
                >
                  {STRUCTURE_GUIDE}
                </pre>
              </div>

              <div style={greenPanel}>
                <p style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#39ff14", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Tips
                </p>
                <ul style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.6", listStylePosition: "inside" }}>
                  <li>Paste your existing lyrics</li>
                  <li>Use proper structure</li>
                  <li>Include deity names</li>
                  <li>Keep lines singable</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Continue Buttons */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={handleContinue}
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "0.5rem",
            background: "linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)",
            color: "#000",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 200ms",
          }}
        >
          Continue to Audio Upload
          <ChevronRight size={16} />
        </button>
        {sunoStyleGenerated && (
          <button
            onClick={handleSkipToAudio}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "0.5rem",
              background: "rgba(57, 255, 20, 0.1)",
              color: "#39ff14",
              border: "1px solid rgba(57, 255, 20, 0.3)",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 200ms",
            }}
          >
            Skip to Scene Breakdown
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
