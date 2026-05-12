// ============================================================
// Step 1: Song Brief & Lyrics
// ============================================================

import { useProject } from "@/contexts/ProjectContext";
import { useState, useEffect } from "react";
import { Music, Copy, Zap, RefreshCw, ChevronDown, ChevronUp, Undo2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DEITIES } from "@/lib/studioData";

// ── Song categories ───────────────────────────────────────────
const SONG_CATEGORIES = [
  { value: "devotional", label: "Devotional",  emoji: "🪔", description: "Bhajan, keertana, stotram" },
  { value: "cinematic",  label: "Cinematic",   emoji: "🎬", description: "Film-style, hero, love, BGM" },
  { value: "folk",       label: "Folk",         emoji: "🥁", description: "Janapada, village, rustic" },
  { value: "romantic",   label: "Romantic",     emoji: "💕", description: "Melody, love, longing" },
  { value: "emotional",  label: "Emotional",    emoji: "🎭", description: "Ballad, heartfelt, raw" },
  { value: "festival",   label: "Festival",     emoji: "🎊", description: "Celebration, occasion" },
  { value: "mass",       label: "Mass",         emoji: "⚡", description: "Attitude, power, anthem" },
] as const;
type SongCategory = (typeof SONG_CATEGORIES)[number]["value"];

// ── Mood options ──────────────────────────────────────────────
const MOOD_OPTIONS = [
  { value: "majestic",    label: "Majestic" },
  { value: "soft",        label: "Soft" },
  { value: "playful",     label: "Playful" },
  { value: "raw",         label: "Raw & Intense" },
  { value: "spiritual",   label: "Spiritual" },
  { value: "triumphant",  label: "Triumphant" },
  { value: "melancholic", label: "Melancholic" },
  { value: "joyful",      label: "Joyful" },
  { value: "aggressive",  label: "Aggressive" },
  { value: "dreamy",      label: "Dreamy" },
];

// ── Language style ────────────────────────────────────────────
const LANGUAGE_STYLES = [
  { value: "pure_telugu", label: "Pure Telugu",    hint: "Classical, traditional" },
  { value: "colloquial",  label: "Colloquial",     hint: "Everyday spoken Telugu" },
  { value: "poetic",      label: "Poetic",         hint: "Rich metaphors & alankara" },
  { value: "mixed",       label: "Mixed (Tenglish)", hint: "Telugu + English blend" },
] as const;

// ── Output type ───────────────────────────────────────────────
const OUTPUT_TYPES = [
  { value: "lyrics_suno",  label: "Lyrics + SUNO style",      hint: "Generates lyrics and a ready-to-paste SUNO music style" },
  { value: "lyrics_only",  label: "Lyrics only",              hint: "Just the lyrics, no SUNO style" },
  { value: "lyrics_scene", label: "Lyrics + Scene direction", hint: "Lyrics plus visual scene notes per section" },
] as const;

// ── Duration options ──────────────────────────────────────────
const DURATION_OPTIONS = [
  { value: 1,  label: "1 min (short intro)" },
  { value: 2,  label: "2 min (short)" },
  { value: 3,  label: "3 min (standard)" },
  { value: 4,  label: "4 min (standard)" },
  { value: 5,  label: "5 min (full song)" },
  { value: 6,  label: "6 min (full song)" },
  { value: 7,  label: "7 min (extended)" },
  { value: 8,  label: "8 min (extended)" },
  { value: 9,  label: "9 min (extended)" },
  { value: 10, label: "10 min (extended)" },
];

// ── Model labels ──────────────────────────────────────────────
const MODEL_LABELS: Record<string, string> = {
  "gemini-2.5-flash":              "Gemini 2.5 Flash",
  "gemini-2.5-pro":                "Gemini 2.5 Pro",
  "gemini-2.0-flash":              "Gemini 2.0 Flash",
  "gemini-2.0-flash-thinking-exp": "Gemini 2.0 Flash Thinking",
  "gemini-1.5-pro":                "Gemini 1.5 Pro",
  "gpt-4o":                        "GPT-4o",
  "gpt-4o-mini":                   "GPT-4o Mini",
  "gpt-4-turbo":                   "GPT-4 Turbo",
  "claude-3-5-haiku-20241022":     "Claude 3.5 Haiku",
  "claude-3-5-sonnet-20241022":    "Claude 3.5 Sonnet",
  "llama-3.1-8b-instant":          "Llama 3.1 8B",
  "llama-3.3-70b-versatile":       "Llama 3.3 70B",
  "qwen-2.5-7b-instruct":          "Qwen 2.5 7B",
  "mistral-small-latest":          "Mistral Small",
};

// ── Subject placeholder / examples per category ───────────────
const SUBJECT_PLACEHOLDER: Record<SongCategory, string> = {
  devotional: "e.g., Ganesha, Venkateswara, Amma, Tirumala pilgrimage…",
  cinematic:  "e.g., Hero intro, Villain reveal, Love at first sight…",
  folk:       "e.g., Bonalu festival, Shepherd romance, Village harvest…",
  romantic:   "e.g., Village love, College crush, Rain romance…",
  emotional:  "e.g., Mother's sacrifice, Heartbreak, Farewell…",
  festival:   "e.g., Sankranti, Ugadi, Diwali, Bathukamma…",
  mass:       "e.g., Police officer intro, Rowdy hero, Revolution anthem…",
};

const VISION_EXAMPLES: Record<SongCategory, string[]> = {
  devotional: [
    "Vinayaka Chavithi song with modak offerings and joyful bhajan feel.",
    "Peaceful bhajan about a devotee's first visit to Tirumala — include Alipiri steps and Govinda chanting.",
    "Powerful Navratri stotram — Durga on her lion, demon slayer imagery, fierce energy.",
  ],
  cinematic: [
    "Hero intro song with attitude, drums, village crowd energy, and whistle moments.",
    "Emotional father-son reunion in rain — flashback of sacrifice, graduation, tears.",
    "Love-at-first-sight melody — college campus, slow zoom, butterflies, soft music.",
  ],
  folk: [
    "Rustic Telangana village song with dappu rhythm, playful call-and-response lines, and harvest festival imagery.",
    "Shepherd boy meets village girl near a river — traditional flute, playful teasing.",
    "Bonalu festival — women carrying decorated pots, dappu beats, village square celebration.",
  ],
  romantic: [
    "Soft melody in rain, longing, memory, and poetic Telugu phrasing.",
    "Long-distance love — phone calls, missing each other, waiting at the bus stop.",
    "Rooftop proposal at sunset — nervous confession, she smiles yes.",
  ],
  emotional: [
    "Mother tribute with intimate lyrics, reflective tone, and soft strings.",
    "Best friends parting — one moves to another city, last evening together by the river.",
    "Heartbreak — she moved on, he replays memories, rain on the window.",
  ],
  festival: [
    "Sankranti — kite flying, sesame sweets, sugarcane stalks, families together.",
    "Ugadi new year — neem flowers, tamarind rice, new clothes, hopeful mood.",
    "Bathukamma — women singing around flower arrangements, evening lamps by the lake.",
  ],
  mass: [
    "Police officer entry — station backdrop, criminals scared, raw power, no compromise.",
    "Village rowdy hero — no one dares cross him, flashback of strength, mass attitude.",
    "Revolution song — common man rises against corrupt system, crowd energy, fists raised.",
  ],
};

const DIRECTION_EXAMPLES: Record<SongCategory, string[]> = {
  devotional: [
    "Focus on Govinda's seven hills and Alipiri pilgrimage.",
    "Include the phrase 'Govinda Govinda' as the main refrain.",
    "Write in the style of Annamacharya, classical Telugu.",
  ],
  cinematic: [
    "Every line should feel like a film frame — visual, punchy, cinematic.",
    "The mukhda must be repeatable — crowd should remember it after one listen.",
    "Mix strong Telugu lines with 1-2 English hook words for mass appeal.",
  ],
  folk: [
    "Use Telangana dialect — Dappu rhythm should come through in every line.",
    "Reference nature: river, mango tree, bullock cart, monsoon clouds.",
    "Keep vocabulary simple — no Sanskrit; pure spoken village Telugu.",
  ],
  romantic: [
    "Use rain, moonlight, and flowers as recurring motifs.",
    "First person — the singer is longing for someone specific.",
    "Each charanam should deepen the emotion, not repeat it.",
  ],
  emotional: [
    "Restraint is powerful — avoid melodrama, let the situation speak.",
    "Ground every emotion in a specific concrete moment or object.",
    "Build slowly — let the outro release all the built-up feeling.",
  ],
  festival: [
    "Name specific foods, rituals, and customs of this festival.",
    "The pallavi must be a crowd chant — short, punchy, repeatable.",
    "Joyful but also traditional — reference how elders celebrate.",
  ],
  mass: [
    "Short punchy lines — maximum impact, minimum words.",
    "Rhetorical questions and declarations ('Who dares face me?').",
    "Attitude throughout — every line is a statement of power.",
  ],
};

// ── Mixed starter examples (shown before a category is explicitly picked) ────
const MIXED_STARTER_EXAMPLES = [
  { cat: "Devotional", text: "Vinayaka Chavithi song with modak offerings and joyful bhajan feel." },
  { cat: "Cinematic",  text: "Hero intro song with attitude, drums, village crowd energy, and whistle moments." },
  { cat: "Folk",       text: "Rustic Telangana village song with dappu rhythm and harvest festival imagery." },
  { cat: "Emotional",  text: "Mother tribute with intimate lyrics, reflective tone, and soft strings." },
];

const MIXED_STARTER_DIRECTION = [
  { cat: "Cinematic",  text: "Every line should feel like a film frame — visual, punchy, cinematic." },
  { cat: "Devotional", text: "Include the main refrain in the opening pallavi and repeat it across all charanams." },
  { cat: "Folk",       text: "Reference nature: river, mango tree, bullock cart, monsoon clouds." },
  { cat: "Mass",       text: "Short punchy lines — maximum impact, minimum words." },
];

// ── Helpers ───────────────────────────────────────────────────
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
    style.style       ? `Style: ${style.style}`       : null,
    style.tempo       ? `Tempo: ${style.tempo}`       : null,
    style.mood        ? `Mood: ${style.mood}`         : null,
    instruments       ? `Instruments: ${instruments}` : null,
    style.vocals      ? `Vocals: ${style.vocals}`     : null,
  ].filter(Boolean).join("\n");
}

function sanitizeLyrics(raw: string): string {
  let cleaned = raw
    .replace(/\r\n/g, "\n")           // Windows line endings
    .replace(/\r/g, "\n")             // Old Mac line endings
    .replace(/\\n/g, "\n")            // Literal \n strings from LLM output
    .replace(/&lt;br\s*\/?&gt;/gi, "\n") // HTML-escaped <br>
    .replace(/&lt;br&gt;/gi, "\n")    // HTML-escaped <br>
    .replace(/<br\s*\/?>/gi, "\n")    // Raw <br> tags
    .trim();

  // Strip trailing lines that are pure English/Latin with no Telugu characters.
  // Also catches common LLM sycophantic closings (blessings, happy wishes, notes).
  const teluguRange = /[ఀ-౿]/;
  const lLMArtifactPattern = /^(note[:\s]|this is|here is|happy|feel free|i hope|blessings?|warm|regards|enjoy|loving|generated|written by|composed by|—\s*\w)/i;
  const lines = cleaned.split("\n");
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (!last) { lines.pop(); continue; }
    const isLatinOnly = !teluguRange.test(last) && /^[a-zA-Z0-9\s,.'!?\-–—()\[\]]+$/.test(last);
    const isSectionHeader = /^\[(Pallavi|Charanam|Outro|Verse|Chorus|Bridge|Intro)/i.test(last);
    const isArtifact = lLMArtifactPattern.test(last);
    if ((isLatinOnly && !isSectionHeader) || isArtifact) { lines.pop(); } else { break; }
  }
  return lines.join("\n").trim();
}

const SUBJECT_SUGGESTIONS: Record<SongCategory, string[]> = {
  devotional: ["Venkateswara", "Ganesha", "Lakshmi", "Shiva", "Durga", "Saraswati", "Hanuman", "Krishna", "Parvati", "Murugan", "Ayyappa", "Govinda", "Narayana", "Meenakshi"],
  cinematic:  ["Hero Intro", "Love Song", "Villain Entry", "Emotional Scene", "Father-Son", "Mass Moment", "Breakup", "Flashback"],
  folk:       ["Bonalu", "Bathukamma", "Village Love", "Shepherd Song", "Harvest Festival", "River Song", "Folk Dance"],
  romantic:   ["First Love", "College Romance", "Village Girl", "Rain Song", "Long Distance", "Proposal", "Missing You"],
  emotional:  ["Mother's Sacrifice", "Heartbreak", "Friendship", "Farewell", "Orphan", "Struggle", "Reunion"],
  festival:   ["Sankranti", "Ugadi", "Diwali", "Vinayaka Chavithi", "Bathukamma", "Navratri", "Holi"],
  mass:       ["Police Entry", "Rowdy Hero", "Villain Warning", "Revolution", "Village Rowdy", "Power Anthem"],
};

function normalizeSubjectKey(name: string): string {
  const map: Record<string, string> = {
    venkateswara: "venkateswara", ganesha: "ganesha",
    lakshmi: "lakshmi", shiva: "shiva",
  };
  return map[name.toLowerCase()] ?? name;
}

// ── Component ─────────────────────────────────────────────────
export default function Step2Lyrics() {
  const { project, setDeity, setTitle, setLyrics, setSunoStyle, setSongMeta, setActiveStep, markStepComplete, undoLyrics, canUndoLyrics } = useProject();

  // Don't pre-fill from project.deity — let the user pick category first
  const [subjectInput,    setSubjectInput]    = useState("");
  const [titleInput,      setTitleInput]      = useState(""); // Always fresh — never pre-filled from localStorage
  const [suggestions,     setSuggestions]     = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [category,      setCategory]      = useState<SongCategory>((project.category as SongCategory) || "devotional");
  const [mood,          setMood]          = useState(project.mood || "");
  const [languageStyle, setLanguageStyle] = useState<string>(project.languageStyle || "pure_telugu");
  const [outputType,    setOutputType]    = useState<string>("lyrics_suno");
  const [duration,      setDuration]      = useState(4);
  const [llmModel,      setLlmModel]      = useState("gemini-2.5-flash");

  const [visionInput,       setVisionInput]       = useState("");
  const [customPrompt,      setCustomPrompt]       = useState("");
  const [isVisionDirective, setIsVisionDirective] = useState(false);

  const [iterateFeedback, setIterateFeedback] = useState("");
  const [showIterate,     setShowIterate]     = useState(false);
  const [sunoFeedback,    setSunoFeedback]    = useState("");
  const [showSunoRefine,  setShowSunoRefine]  = useState(false);
  // Only show SUNO panel after a successful generation in the current session
  const [showSunoPanel,   setShowSunoPanel]   = useState(false);
  // Track whether user has explicitly clicked a category (shows mixed examples before that)
  const [hasPicked,       setHasPicked]       = useState(false);

  // Persist category/mood/languageStyle to project context whenever they change
  useEffect(() => { setSongMeta({ category, mood, languageStyle }); }, [category, mood, languageStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the song brief idea changes, discard any stale AI-generated directive so it
  // can't accidentally be used for a generation that was intended for the new idea.
  useEffect(() => {
    if (isVisionDirective) {
      setCustomPrompt("");
      setIsVisionDirective(false);
    }
  }, [visionInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset suggestions + SUNO panel when category changes
  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    setShowSunoPanel(false);
  }, [category]);

  // On mount: sanitize any stored lyrics and mark step 1 complete if lyrics exist
  useEffect(() => {
    if (project.lyrics) {
      markStepComplete(1);
      const cleaned = sanitizeLyrics(project.lyrics);
      if (cleaned !== project.lyrics) setLyrics(cleaned);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-mark step 1 complete whenever lyrics appear (e.g. after generation)
  useEffect(() => {
    if (project.lyrics) markStepComplete(1);
  }, [project.lyrics]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (subjectInput.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      setSuggestions(
        SUBJECT_SUGGESTIONS[category]
          .filter((s) => s.toLowerCase().includes(subjectInput.toLowerCase()))
          .slice(0, 6)
      );
    }, 250);
    return () => clearTimeout(t);
  }, [subjectInput, category]);

  const handleSelectSubject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubjectInput(trimmed);
    setDeity(normalizeSubjectKey(trimmed));
    setShowSuggestions(false);
    if (!titleInput) {
      const autoTitle = `${trimmed} ${category === "devotional" ? "Devotional Song" : "Song"}`;
      setTitleInput(autoTitle);
      setTitle(autoTitle);
    }
  };

  const handleSubjectBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
    if (subjectInput.trim() && !project.deity) handleSelectSubject(subjectInput.trim());
  };

  const effectiveSubject = project.deity || subjectInput.trim();

  // ── tRPC mutations ────────────────────────────────────────
  const generateMutation = trpc.generation.generateLyrics.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) { toast.error(res.error ?? "Generation failed"); return; }
      setLyrics(sanitizeLyrics(res.data.lyrics));
      if (res.data.sunoStyle) {
        setSunoStyle(res.data.sunoStyle);
        setShowSunoPanel(true);
      }
      markStepComplete(1);
      setShowIterate(true);
      // Clear directive after use so the next generation starts fresh
      setCustomPrompt("");
      setIsVisionDirective(false);
      toast.success("Lyrics generated!");
    },
    onError: (err) => {
      const msg = err.data?.code === "FORBIDDEN" ? err.message : "Generation failed — check your API key in Settings";
      toast.error(msg);
    },
  });

  const refineSunoMutation = trpc.generation.refineSunoStyle.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) { toast.error(res.error ?? "Refine failed"); return; }
      setSunoStyle(res.data as Record<string, unknown>);
      setSunoFeedback("");
      setShowSunoRefine(false);
      toast.success("SUNO style updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const promptGenMutation = trpc.generation.generateLyricsPrompt.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) { toast.error(res.error ?? "Prompt generation failed"); return; }
      setCustomPrompt(res.data.prompt);
      setIsVisionDirective(true);
      toast.success("Directive ready — review it below, then generate!");
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Handlers ─────────────────────────────────────────────
  const handleGenerate = () => {
    if (!effectiveSubject) { toast.error("Please enter a subject or topic first"); return; }
    if (!project.deity) handleSelectSubject(effectiveSubject);
    const trimmed = customPrompt.trim();
    generateMutation.mutate({
      deity:           effectiveSubject,
      category:        category as any,
      mood:            mood || undefined,
      languageStyle:   languageStyle as any,
      outputType:      outputType as any,
      duration,
      llmModel,
      directivePrompt: isVisionDirective && trimmed ? trimmed : undefined,
      customPrompt:    !isVisionDirective && trimmed ? trimmed : undefined,
    });
  };

  const handleIterate = () => {
    if (!iterateFeedback.trim()) { toast.error("Please describe what you'd like to change"); return; }
    generateMutation.mutate({
      deity:        effectiveSubject || project.deity!,
      category:     category as any,
      mood:         mood || undefined,
      languageStyle: languageStyle as any,
      outputType:   outputType as any,
      duration,
      llmModel,
      customPrompt: `Current lyrics for reference:\n${project.lyrics}\n\nUser wants these changes: ${iterateFeedback}\n\nRegenerate incorporating these changes.`,
    });
    setIterateFeedback("");
  };

  const handleRefineSuno = () => {
    if (!sunoFeedback.trim()) { toast.error("Please describe what you'd like to change"); return; }
    refineSunoMutation.mutate({
      lyrics:       project.lyrics,
      currentStyle: project.sunoStyle as unknown as Record<string, unknown>,
      feedback:     sunoFeedback,
      deity:        project.deity ?? undefined,
    });
  };

  const isGenerating   = generateMutation.isPending;
  const isRefiningSuno = refineSunoMutation.isPending;
  const sunoStyle      = project.sunoStyle as unknown as Record<string, unknown> | null;
  const canContinue    = !!effectiveSubject && !!project.title.trim() && !!project.lyrics;

  const generateLabel = project.lyrics ? "Regenerate lyrics" : "Generate lyrics";

  // ── Styles ────────────────────────────────────────────────
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

  const helperStyle = { fontSize: "0.72rem", color: "rgba(255,255,255,0.32)", marginTop: "0.35rem", lineHeight: "1.5" } as const;
  const examplesBox = { marginTop: "0.6rem", padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.375rem" } as const;

  const chip = (active: boolean, color = "rgba(0,212,255") => ({
    padding: "0.3rem 0.8rem",
    borderRadius: "999px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 150ms",
    background: active ? `${color},0.25)` : `${color},0.06)`,
    color: active ? `${color},1)` : `${color},0.5)`,
    border: `1px solid ${active ? `${color},0.55)` : `${color},0.18)`}`,
    whiteSpace: "nowrap" as const,
  });

  const primaryBtn = (disabled: boolean) => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    background: disabled ? "rgba(0,212,255,0.15)" : "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
    color: disabled ? "rgba(255,255,255,0.3)" : "#000",
    border: "none", borderRadius: "0.5rem",
    fontWeight: "700" as const, fontSize: "0.95rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms",
  } as const);

  const secondaryBtn = (disabled: boolean) => ({
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.625rem 1.125rem",
    background: disabled ? "rgba(0,212,255,0.08)" : "rgba(0,212,255,0.15)",
    color: disabled ? "rgba(0,212,255,0.35)" : "#00d4ff",
    border: `1px solid ${disabled ? "rgba(0,212,255,0.1)" : "rgba(0,212,255,0.4)"}`,
    borderRadius: "0.375rem",
    fontWeight: "600" as const, fontSize: "0.8rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms",
  } as const);

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ background: "#0a0e27", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(0,212,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Step 1 · Concept & Lyrics
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#00d4ff", margin: "0 0 0.4rem" }}>
            Concept & Lyrics
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Pick a category, describe your vision — get full Telugu lyrics, a SUNO music style, and scene notes ready for production.
          </p>
        </div>

        {/* ── LLM MODEL (top-level, used for all generations) ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", padding: "0.65rem 1rem", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.18)", borderRadius: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,212,255,0.6)", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Model</span>
          <select
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "0.4rem 0.6rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: "0.375rem", color: "#00d4ff", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", outline: "none" }}
          >
            <optgroup label="Gemini (platform key — no setup needed)">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash — fast · default</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro — most capable</option>
            </optgroup>
            <optgroup label="Gemini (requires your Gemini API key)">
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.0-flash-thinking-exp">Gemini 2.0 Flash Thinking</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </optgroup>
            <optgroup label="ChatGPT (requires your OpenAI API key)">
              <option value="gpt-4o">GPT-4o — powerful</option>
              <option value="gpt-4o-mini">GPT-4o Mini — fast · cheap</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </optgroup>
            <optgroup label="Claude (requires your Anthropic API key)">
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku — fast · excellent</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet — best quality</option>
            </optgroup>
            <optgroup label="Groq / Llama (requires your Groq API key — free tier)">
              <option value="llama-3.1-8b-instant">Llama 3.1 8B — ultra-fast · free</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B — quality · free</option>
              <option value="qwen-2.5-7b-instruct">Qwen 2.5 7B — multilingual · free</option>
            </optgroup>
            <optgroup label="Mistral (requires your Mistral API key — free tier)">
              <option value="mistral-small-latest">Mistral Small — multilingual · free</option>
            </optgroup>
          </select>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic", whiteSpace: "nowrap" }}>Used for all generations on this page</span>
        </div>

        {/* ── SONG CATEGORY ────────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem" }}>
          <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>Song category</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value as SongCategory); setHasPicked(true); }}
            style={{ width: "100%", padding: "0.625rem 0.75rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "0.375rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", outline: "none" }}
          >
            {SONG_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label} — {cat.description}</option>
            ))}
          </select>
        </div>

        {/* ── SUBJECT & TITLE ──────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem" }}>
            Subject & title
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Subject input */}
            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Subject or topic</label>
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => { setSubjectInput(e.target.value); setShowSuggestions(true); }}
                onBlur={handleSubjectBlur}
                onFocus={() => subjectInput.length >= 2 && setShowSuggestions(true)}
                placeholder={SUBJECT_PLACEHOLDER[category]}
                style={{ ...inputStyle, resize: undefined }}
              />
              <p style={helperStyle}>{SUBJECT_PLACEHOLDER[category]}</p>
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 1.6rem)", left: 0, right: 0, zIndex: 20,
                  background: "#0d1230", border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "0.375rem", marginTop: "2px", overflow: "hidden",
                }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => handleSelectSubject(s)}
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
              <label style={labelStyle}>Song title</label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => { setTitleInput(e.target.value); setTitle(e.target.value); }}
                placeholder={subjectInput ? `${subjectInput} Song` : "e.g., Venkateswara Devotional Song"}
                style={{ ...inputStyle, resize: undefined }}
              />
              <p style={helperStyle}>Used for YouTube title, thumbnail, and metadata.</p>
            </div>
          </div>
          {subjectInput && !project.deity && (
            <button
              onMouseDown={() => handleSelectSubject(subjectInput)}
              style={{ marginTop: "0.6rem", padding: "0.4rem 1rem", background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.35)", borderRadius: "0.375rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
            >
              Use "{subjectInput}"
            </button>
          )}
        </div>

        {/* ── SONG BRIEF ───────────────────────────────── */}
        {effectiveSubject && (
          <div style={{ ...panel, marginBottom: "1.25rem", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.04)" }}>
            <div style={{ marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Wand2 size={15} style={{ color: "#8b5cf6" }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8b5cf6", margin: 0 }}>Song brief</p>
            </div>
            <p style={{ fontSize: "0.78rem", color: "rgba(139,92,246,0.6)", marginBottom: "1rem" }}>
              Describe your vision. AI will write a detailed lyrics directive.
            </p>

            {/* Mood chips */}
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ ...labelStyle, color: "rgba(139,92,246,0.7)" }}>Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "0.375rem", color: "#a78bfa", fontSize: "0.875rem", cursor: "pointer", outline: "none" }}
              >
                <option value="">— Select mood (optional) —</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Language style */}
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ ...labelStyle, color: "rgba(139,92,246,0.7)" }}>Language style</label>
              <select
                value={languageStyle}
                onChange={(e) => setLanguageStyle(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "0.375rem", color: "#a78bfa", fontSize: "0.875rem", cursor: "pointer", outline: "none" }}
              >
                {LANGUAGE_STYLES.map((ls) => (
                  <option key={ls.value} value={ls.value}>{ls.label} — {ls.hint}</option>
                ))}
              </select>
            </div>

            {/* Song brief quick-pick + custom textarea */}
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ ...labelStyle, color: "rgba(139,92,246,0.7)" }}>Song brief</label>
              <select
                value=""
                onChange={(e) => { if (e.target.value) setVisionInput(e.target.value); }}
                style={{ width: "100%", padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "0.375rem", color: "rgba(139,92,246,0.7)", fontSize: "0.8rem", cursor: "pointer", outline: "none", marginBottom: "0.5rem" }}
              >
                <option value="">— Quick pick an example (optional) —</option>
                {(hasPicked ? VISION_EXAMPLES[category] : MIXED_STARTER_EXAMPLES.map(e => e.text)).map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
              <textarea
                value={visionInput}
                onChange={(e) => setVisionInput(e.target.value)}
                rows={3}
                placeholder="Describe the setting, mood, and key imagery for your song…"
                style={{ ...inputStyle, fontSize: "0.875rem", lineHeight: "1.5", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.06)" }}
              />
            </div>

            <button
              onClick={() => {
                if (!visionInput.trim()) { toast.error("Describe your idea first"); return; }
                if (!project.deity) handleSelectSubject(effectiveSubject);
                promptGenMutation.mutate({ deity: effectiveSubject, userIdea: visionInput, category: category as any, mood: mood || undefined, llmModel });
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
                : <><Wand2 size={14} /> Generate prompt with AI</>
              }
            </button>

            {customPrompt && (
              <p style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "#a78bfa", fontStyle: "italic" }}>
                ✓ Directive ready — review or edit it in "Custom direction" below.
              </p>
            )}
          </div>
        )}

        {/* ── GENERATION SETTINGS ──────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem" }}>
            Generation settings
          </p>

          {/* Output type */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Output type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {OUTPUT_TYPES.map((ot) => (
                <button
                  key={ot.value}
                  onClick={() => setOutputType(ot.value)}
                  style={chip(outputType === ot.value)}
                >
                  {ot.label}
                </button>
              ))}
            </div>
            <p style={helperStyle}>
              {outputType === "lyrics_suno"  && "After generating you'll receive lyrics plus a SUNO music style block (tempo, instruments, mood, vocals) ready to paste directly into Suno."}
              {outputType === "lyrics_only"  && "Generates lyrics only — no SUNO block. Use this if you're scoring or recording the music separately."}
              {outputType === "lyrics_scene" && "Generates lyrics plus a visual scene note per section (Pallavi, Charanam) describing mood, shot type, and setting. Feeds directly into Step 3 Scene Breakdown."}
            </p>
            {/* If there's a saved SUNO style from a previous generation, offer to restore it */}
            {!showSunoPanel && sunoStyle && outputType !== "lyrics_only" && (
              <button
                onClick={() => setShowSunoPanel(true)}
                style={{ marginTop: "0.4rem", background: "none", border: "none", padding: 0, fontSize: "0.7rem", color: "rgba(255,0,110,0.6)", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
              >
                Show SUNO style from previous generation →
              </button>
            )}
          </div>

          {/* Duration */}
          <div>
            <label style={labelStyle}>Song duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "0.375rem", color: "#00d4ff", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", outline: "none", minWidth: "185px" }}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <p style={helperStyle}>Affects how long the lyrics and SUNO audio will be.</p>
          </div>
        </div>

        {/* ── CUSTOM DIRECTION ─────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1.25rem", border: "1px solid rgba(0,212,255,0.12)" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", marginBottom: "0.25rem" }}>
            Custom direction <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>(optional)</span>
          </p>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.85rem" }}>
            Override the default AI prompt with very specific instructions about style, phrases, or structure.
          </p>

          {customPrompt && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.75rem", color: isVisionDirective ? "#a78bfa" : "rgba(255,255,255,0.35)", fontStyle: "italic", margin: 0 }}>
                {isVisionDirective ? "✓ AI-generated directive — you can edit it here." : "Custom direction active"}
              </p>
              <button
                onClick={() => { setCustomPrompt(""); setIsVisionDirective(false); }}
                style={{ background: "none", border: "none", padding: "0 0.25rem", fontSize: "0.7rem", color: "rgba(255,80,80,0.5)", cursor: "pointer", fontWeight: 600 }}
              >
                ✕ Clear
              </button>
            </div>
          )}

          <textarea
            value={customPrompt}
            onChange={(e) => { setCustomPrompt(e.target.value); setIsVisionDirective(false); }}
            rows={3}
            placeholder="Add specific style or structure instructions here…"
            style={{ ...inputStyle, lineHeight: "1.5", fontSize: "0.875rem", marginBottom: "0.5rem" }}
          />

          <div style={examplesBox}>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,0.22)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {hasPicked ? `${SONG_CATEGORIES.find(c => c.value === category)?.label} examples` : "Examples · pick a category to filter"}{" "}
              <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.7 }}>· click to use</span>
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {hasPicked
                ? DIRECTION_EXAMPLES[category].map((ex) => (
                    <li key={ex}>
                      <button
                        onClick={() => { setCustomPrompt(ex); setIsVisionDirective(false); }}
                        style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "0.15rem 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: "1.4", width: "100%", marginBottom: "0.15rem" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(0,212,255,0.75)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                      >
                        • {ex}
                      </button>
                    </li>
                  ))
                : MIXED_STARTER_DIRECTION.map((ex) => (
                    <li key={ex.text}>
                      <button
                        onClick={() => { setCustomPrompt(ex.text); setIsVisionDirective(false); }}
                        style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "0.15rem 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: "1.4", width: "100%", marginBottom: "0.15rem", display: "flex", gap: "0.4rem" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(0,212,255,0.75)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                      >
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", flexShrink: 0, paddingTop: "1px" }}>[{ex.cat}]</span>
                        {ex.text}
                      </button>
                    </li>
                  ))
              }
            </ul>
          </div>

          {project.lyrics && customPrompt.trim() && (
            <p style={{ ...helperStyle, marginTop: "0.5rem" }}>
              Direction saved — click <strong style={{ color: "rgba(0,212,255,0.7)" }}>Regenerate lyrics</strong> above to apply it.
            </p>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !effectiveSubject}
          style={{ ...primaryBtn(isGenerating || !effectiveSubject), width: "100%", marginBottom: !effectiveSubject ? "0.5rem" : "1.75rem" }}
        >
          {isGenerating
            ? <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Generating lyrics…</>
            : <><Zap size={18} /> {generateLabel}</>
          }
        </button>
        {!effectiveSubject && !isGenerating && (
          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "rgba(255,255,255,0.32)", marginBottom: "1.75rem" }}>
            Enter a subject or topic above to enable generation.
          </p>
        )}

        {/* ── GENERATED LYRICS ─────────────────────────── */}
        {project.lyrics && (
          <>
            <div style={{ ...panel, marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00d4ff", margin: "0 0 0.25rem" }}>Generated lyrics</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", margin: "0 0 0.75rem" }}>
                Edit freely — changes save automatically.
              </p>
              <textarea
                value={sanitizeLyrics(project.lyrics)}
                onChange={(e) => setLyrics(e.target.value)}
                rows={14}
                style={{ ...inputStyle, color: "#a8d8ea", fontFamily: "monospace", fontSize: "0.875rem", lineHeight: "1.7", minHeight: "260px" }}
              />
              {/* Action row — below the content so the flow is: read → act */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {canUndoLyrics && (
                  <button
                    onClick={() => { undoLyrics(); toast.success("Restored previous lyrics"); }}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.9rem", background: "rgba(255,150,50,0.12)", color: "#ff9632", border: "1px solid rgba(255,150,50,0.35)", borderRadius: "0.375rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Undo2 size={13} /> Undo last change
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(sanitizeLyrics(project.lyrics), "Lyrics")}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.9rem", background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.35)", borderRadius: "0.375rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Copy size={13} /> Copy lyrics
                </button>
              </div>
            </div>

            {/* Iterate — separate card so it reads as a distinct action */}
            <div style={{ ...panel, marginBottom: "1.25rem", border: "1px solid rgba(255,255,255,0.08)" }}>
              <button
                onClick={() => setShowIterate(!showIterate)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: showIterate ? "#00d4ff" : "rgba(255,255,255,0.6)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 700, padding: 0, width: "100%", textAlign: "left" }}
              >
                {showIterate ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                Iterate with feedback
              </button>

              {showIterate && (
                <div style={{ marginTop: "0.85rem" }}>
                  <p style={{ ...helperStyle, marginBottom: "0.6rem" }}>
                    Describe what to change — the AI keeps your subject, category, and mood and rewrites accordingly.
                  </p>
                  <textarea
                    value={iterateFeedback}
                    onChange={(e) => setIterateFeedback(e.target.value)}
                    rows={3}
                    placeholder={`e.g., "Make the Pallavi shorter and more catchy"\ne.g., "The Charanam feels too long — trim it to 4 lines"\ne.g., "Add more cultural imagery — include the temple bells"`}
                    style={{ ...inputStyle, fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "0.75rem" }}
                  />
                  <button
                    onClick={handleIterate}
                    disabled={isGenerating || !iterateFeedback.trim()}
                    style={secondaryBtn(isGenerating || !iterateFeedback.trim())}
                  >
                    {isGenerating
                      ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Regenerating…</>
                      : <><RefreshCw size={14} /> Apply changes</>
                    }
                  </button>
                  {!iterateFeedback.trim() && (
                    <p style={{ ...helperStyle, marginTop: "0.4rem" }}>Type what to change above, then click Apply.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SUNO STYLE ───────────────────────────────── */}
        {showSunoPanel && sunoStyle && outputType !== "lyrics_only" && (
          <div style={{ ...panel, background: "linear-gradient(135deg, rgba(255,0,110,0.06) 0%, rgba(0,212,255,0.06) 100%)", border: "1px solid rgba(255,0,110,0.22)", marginBottom: "1.75rem" }}>
            {/* Header — title + description only */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
              <Music size={17} style={{ color: "#ff006e" }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ff006e", margin: 0 }}>SUNO music style</p>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem" }}>
              A ready-to-paste style prompt for SUNO. Refine to localize instruments or tempo.
            </p>

            {/* Style text first — read it, then act on it */}
            <pre style={{ margin: 0, padding: "0.875rem", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,0,110,0.2)", borderRadius: "0.375rem", color: "#ff006e", fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 600, lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {sunoStyleText(sunoStyle)}
            </pre>

            {/* Action buttons — below the style text */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                onClick={() => copyToClipboard(sunoStyleText(sunoStyle), "SUNO style")}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: "rgba(255,0,110,0.12)", color: "#ff006e", border: "1px solid rgba(255,0,110,0.35)", borderRadius: "0.375rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
              >
                <Copy size={13} /> Copy for SUNO
              </button>
              <button
                onClick={() => setShowSunoRefine(!showSunoRefine)}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
              >
                {showSunoRefine ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                Refine style with AI
              </button>
            </div>

            {showSunoRefine && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,0,110,0.15)" }}>
                <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>What would you like to change in the music style?</label>
                <textarea
                  value={sunoFeedback}
                  onChange={(e) => setSunoFeedback(e.target.value)}
                  rows={2}
                  placeholder="e.g., slower tempo, add nadaswaram, female vocals, more raw folk feel"
                  style={{ ...inputStyle, fontSize: "0.875rem", marginBottom: "0.75rem" }}
                />
                <button
                  onClick={handleRefineSuno}
                  disabled={isRefiningSuno || !sunoFeedback.trim()}
                  style={secondaryBtn(isRefiningSuno || !sunoFeedback.trim())}
                >
                  {isRefiningSuno
                    ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Refining…</>
                    : <><Zap size={13} /> Apply changes</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* Continue — full-width, visually separated from the iterate/SUNO sections */}
        {project.lyrics && (
          <div style={{ paddingTop: "0.5rem" }}>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "1.5rem" }} />
            <button
              onClick={() => { if (!canContinue) return; markStepComplete(1); setActiveStep(2); }}
              disabled={!canContinue}
              style={{
                width: "100%", padding: "1rem",
                background: canContinue ? "linear-gradient(135deg, #39ff14 0%, #00cc00 100%)" : "rgba(255,255,255,0.08)",
                color: canContinue ? "#000" : "rgba(255,255,255,0.3)",
                border: "none", borderRadius: "0.5rem",
                fontWeight: 700, fontSize: "1rem",
                cursor: canContinue ? "pointer" : "not-allowed",
                transition: "all 200ms",
              }}
            >
              Continue to audio upload →
            </button>
            {!canContinue && (
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.32)", textAlign: "center", marginTop: "0.5rem" }}>
                {!project.title.trim() ? "Add a song title above to continue." : "Generate lyrics first, then continue."}
              </p>
            )}
          </div>
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
