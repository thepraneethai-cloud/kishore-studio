// ============================================================
// Step 1: Song Brief & Lyrics
// ============================================================

import { useProject } from "@/contexts/ProjectContext";
import { useState, useEffect } from "react";
import { Music, Copy, Zap, RefreshCw, ChevronDown, ChevronUp, Undo2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DEITIES } from "@/lib/studioData";
import { useMasterPrompt } from "@/hooks/useMasterPrompt";
import { MasterPromptPanel } from "@/components/MasterPromptPanel";

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
  const { project, setDeity, setTitle, setLyrics, setSunoStyle, setMasterPrompt, setCreativeBrief, setExtraDirection, setSongMeta, setActiveStep, markStepComplete, undoLyrics, canUndoLyrics, resetProject } = useProject();
  const { masterPrompt, showMasterPromptPanel, setShowMasterPromptPanel, masterPromptFeedback, setMasterPromptFeedback, generateMasterPrompt, refineMasterPrompt, isGenerating: isMasterPromptGenerating, isRefining: isMasterPromptRefining } = useMasterPrompt();

  const [subjectInput,    setSubjectInput]    = useState("");
  const [titleInput,      setTitleInput]      = useState("");
  const [suggestions,     setSuggestions]     = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [category,      setCategory]      = useState<SongCategory>((project.category as SongCategory) || "devotional");
  const [mood,          setMood]          = useState(project.mood || "");
  const [languageStyle, setLanguageStyle] = useState<string>(project.languageStyle || "pure_telugu");
  const [outputType,    setOutputType]    = useState<string>("lyrics_suno");
  const [duration,      setDuration]      = useState(4);
  const [llmModel,      setLlmModel]      = useState("gemini-2.5-flash");

  const [visionInput,       setVisionInputLocal]  = useState(project.creativeBrief || "");
  const [customPrompt,      setCustomPromptLocal] = useState(project.extraDirection || "");
  const [isVisionDirective, setIsVisionDirective] = useState(false);

  const setVisionInput = (v: string) => { setVisionInputLocal(v); setCreativeBrief(v); };
  const setCustomPrompt = (v: string) => { setCustomPromptLocal(v); setExtraDirection(v); };

  const [promptStatus,    setPromptStatus]    = useState<"idle" | "done" | "error">("idle");
  const [promptError,     setPromptError]     = useState("");
  const [iterateFeedback, setIterateFeedback] = useState("");
  const [showIterate,     setShowIterate]     = useState(false);
  const [sunoFeedback,    setSunoFeedback]    = useState("");
  const [showSunoRefine,  setShowSunoRefine]  = useState(false);
  // Only show SUNO panel after a successful generation in the current session
  const [showSunoPanel,   setShowSunoPanel]   = useState(false);
  // Track whether user has explicitly clicked a category (shows mixed examples before that)
  const [hasPicked,       setHasPicked]       = useState(false);
  // Master Prompt generation phase
  const [showMasterPromptPhase, setShowMasterPromptPhase] = useState(false);
  const [masterPromptEditable, setMasterPromptEditable] = useState("");
  const [masterPromptReady, setMasterPromptReady] = useState(false);

  // Persist category/mood/languageStyle to project context whenever they change
  useEffect(() => { setSongMeta({ category, mood, languageStyle }); }, [category, mood, languageStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset suggestions + SUNO panel when category changes
  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    setShowSunoPanel(false);
  }, [category]);

  // Keep visible form fields in sync when switching or starting projects.
  useEffect(() => {
    setSubjectInput(project.deity ? String(project.deity) : "");
    setTitleInput(project.title || "");
    setCategory((project.category as SongCategory) || "devotional");
    setMood(project.mood || "");
    setLanguageStyle(project.languageStyle || "pure_telugu");
    setVisionInputLocal(project.creativeBrief || "");
    setCustomPromptLocal(project.extraDirection || "");
    setIsVisionDirective(false);
    setPromptStatus("idle");
    setPromptError("");
    setIterateFeedback("");
    setShowIterate(false);
    setSunoFeedback("");
    setShowSunoRefine(false);
    setShowSunoPanel(false);
    setHasPicked(false);
    setMasterPromptEditable(project.masterPrompt || "");
    setMasterPromptReady(Boolean(project.masterPrompt));
    setShowMasterPromptPhase(Boolean(project.masterPrompt));
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-mark step 1 complete whenever lyrics appear (e.g. after generation)
  useEffect(() => {
    if (project.lyrics) markStepComplete(1);
  }, [project.lyrics]); // eslint-disable-line react-hooks/exhaustive-deps
  // Sync Master Prompt to editable state when generated or regenerated
  useEffect(() => {
    if (masterPrompt) {
      setMasterPromptEditable(masterPrompt);
      if (!project.lyrics) setShowMasterPromptPhase(true);
    }
  }, [masterPrompt, project.lyrics]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const effectiveSubject = subjectInput.trim();

  // ── tRPC mutations ────────────────────────────────────────
  const generateMutation = trpc.generation.generateLyrics.useMutation({
    onSuccess: (res) => {
      if (!res.success || !res.data) { toast.error(res.error ?? "Generation failed"); return; }
      setLyrics(sanitizeLyrics(res.data.lyrics));
      if (res.data.sunoStyle) {
        setSunoStyle(res.data.sunoStyle);
        setShowSunoPanel(true);
      }
      generateMasterPrompt(effectiveSubject, res.data.lyrics, customPrompt, category, mood, llmModel);
      markStepComplete(1);
      setShowIterate(true);
      // KEEP custom directions so user can refine and regenerate without retyping
      // Only clear the vision input field so it doesn't clutter the UI
      setVisionInput("");
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
      if (!res.success || !res.data) {
        setPromptStatus("error");
        setPromptError(res.error ?? "Prompt generation failed");
        return;
      }
      setCustomPrompt(res.data.prompt);
      setIsVisionDirective(true);
      setPromptStatus("done");
      setPromptError("");
    },
    onError: (err) => {
      setPromptStatus("error");
      setPromptError(err.message ?? "Generation failed");
    },
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
  const handleGenerateMasterPrompt = () => {
    if (!effectiveSubject) { toast.error("Please enter a subject or topic first"); return; }
    if (!project.deity) handleSelectSubject(effectiveSubject);
    const trimmed = customPrompt.trim();
    setShowMasterPromptPhase(true);
    generateMasterPrompt(effectiveSubject, "", trimmed, category, mood, llmModel, languageStyle, outputType, duration)
      .then((prompt) => {
        if (prompt) {
          setMasterPromptEditable(prompt);
          setShowMasterPromptPhase(true);
        }
      });
  };

  const handleGenerateLyricsWithMasterPrompt = () => {
    if (!masterPromptEditable.trim()) {
      toast.error("Please generate a Master Prompt first");
      return;
    }
    const trimmed = customPrompt.trim();
    generateMutation.mutate({
      deity:           effectiveSubject,
      category:        category as any,
      mood:            mood || undefined,
      languageStyle:   languageStyle as any,
      outputType:      outputType as any,
      duration,
      llmModel,
      masterPrompt:    masterPromptEditable,
      directivePrompt: isVisionDirective && trimmed ? trimmed : undefined,
      customPrompt:    !isVisionDirective && trimmed ? trimmed : undefined,
    });
    setShowMasterPromptPhase(false);
  };

  const handleIterate = () => {
    if (!iterateFeedback.trim()) { toast.error("Please describe what you'd like to change"); return; }
    generateMutation.mutate({
      deity:        effectiveSubject,
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
  const hasLyrics      = sanitizeLyrics(project.lyrics).trim().length > 0;
  const canContinue    = !!project.title.trim() && hasLyrics;

  const generateLabel = project.lyrics ? "Regenerate lyrics" : "Generate lyrics";

  // ── Styles ────────────────────────────────────────────────
  const panel = {
    background: "#2f2f2f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    padding: "1.25rem",
    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
  } as const;

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    background: "#2a2a2a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.5rem",
    color: "rgba(255,255,255,0.88)",
    fontSize: "0.9rem",
    resize: "vertical" as const,
    outline: "none",
  };

  const selectStyle = {
    ...inputStyle,
    resize: undefined,
    color: "rgba(236,236,241,0.82)",
    fontWeight: 600,
    cursor: "pointer",
  } as const;

  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "block" as const,
    marginBottom: "0.4rem",
  };

  const helperStyle = { fontSize: "0.72rem", color: "rgba(255,255,255,0.38)", marginTop: "0.35rem", lineHeight: "1.5" } as const;
  const examplesBox = { marginTop: "0.75rem", padding: "0.75rem", background: "rgba(4,8,24,0.55)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.5rem" } as const;

  const chip = (active: boolean, color = "rgba(236,236,241") => ({
    padding: "0.3rem 0.8rem",
    borderRadius: "999px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 150ms",
    background: active ? `${color},0.25)` : "rgba(255,255,255,0.04)",
    color: active ? "rgba(236,236,241,0.9)" : "rgba(236,236,241,0.5)",
    border: `1px solid ${active ? `${color},0.55)` : "rgba(255,255,255,0.1)"}`,
    whiteSpace: "nowrap" as const,
  });

  const primaryBtn = (disabled: boolean) => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    background: disabled ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #00d4ff 0%, #39ff14 100%)",
    color: disabled ? "rgba(255,255,255,0.3)" : "#000",
    border: "none", borderRadius: "0.65rem",
    fontWeight: "700" as const, fontSize: "0.95rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms",
  } as const);

  const secondaryBtn = (disabled: boolean) => ({
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.625rem 1.125rem",
    background: disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)",
    color: disabled ? "rgba(236,236,241,0.35)" : "rgba(236,236,241,0.82)",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.2)"}`,
    borderRadius: "0.375rem",
    fontWeight: "600" as const, fontSize: "0.8rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 200ms",
  } as const);

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(236,236,241,0.45)", letterSpacing: "0.08em" }}>
            Step 1
          </p>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#ececf1", letterSpacing: "-0.01em" }}>
            Concept &amp; Lyrics
          </h2>
          <p className="text-sm" style={{ color: "rgba(236,236,241,0.6)" }}>
            Fill the brief once. The studio will create lyrics, SUNO style, and scene-ready direction from it.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(236,236,241,0.6)", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Model
          </span>
          <select
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
            style={{ ...selectStyle, flex: 1, minWidth: "240px", padding: "0.55rem 0.75rem" }}
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
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.36)", whiteSpace: "nowrap" }}>
            Used for all generation on this page
          </span>
        </div>

        <div style={{ ...panel, marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", marginBottom: "1rem" }}>
            1. Basic details
          </p>
          <div className="concept-grid">
            <div>
              <label style={labelStyle}>Song category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as SongCategory); setHasPicked(true); }}
                style={selectStyle}
              >
                {SONG_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label} — {cat.description}</option>
                ))}
              </select>
            </div>
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
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 0.25rem)", left: 0, right: 0, zIndex: 20,
                  background: "#0d1230", border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "0.5rem", marginTop: "2px", overflow: "hidden",
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
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(236,236,241,0.82)"; }}
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
            </div>
          </div>
          <p style={helperStyle}>{SUBJECT_PLACEHOLDER[category]}</p>
          {subjectInput && !project.deity && (
            <button
              onMouseDown={() => handleSelectSubject(subjectInput)}
              style={{ marginTop: "0.75rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.07)", color: "rgba(236,236,241,0.82)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
            >
              Use "{subjectInput}"
            </button>
          )}
        </div>

        {/* ── GENERATION SETTINGS ──────────────────────── */}
        <div style={{ ...panel, marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", marginBottom: "1rem" }}>
            2. Generation settings
          </p>

          <div className="concept-grid">
            <div>
              <label style={labelStyle}>Output type</label>
              <select value={outputType} onChange={(e) => setOutputType(e.target.value)} style={selectStyle}>
                {OUTPUT_TYPES.map((ot) => (
                  <option key={ot.value} value={ot.value}>{ot.label} — {ot.hint}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Song duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={selectStyle}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mood</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)} style={selectStyle}>
                <option value="">Select mood (optional)</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Language style</label>
              <select value={languageStyle} onChange={(e) => setLanguageStyle(e.target.value)} style={selectStyle}>
                {LANGUAGE_STYLES.map((ls) => (
                  <option key={ls.value} value={ls.value}>{ls.label} — {ls.hint}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={helperStyle}>
            {outputType === "lyrics_suno"  && "Lyrics plus a ready-to-paste SUNO music style block."}
            {outputType === "lyrics_only"  && "Lyrics only, useful when music is handled separately."}
            {outputType === "lyrics_scene" && "Lyrics plus scene notes that feed the scene breakdown."}
          </p>
          {!showSunoPanel && sunoStyle && outputType !== "lyrics_only" && (
            <button
              onClick={() => setShowSunoPanel(true)}
              style={{ marginTop: "0.4rem", background: "none", border: "none", padding: 0, fontSize: "0.72rem", color: "rgba(236,236,241,0.55)", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
            >
              Show SUNO style from previous generation
            </button>
          )}
        </div>

        {/* ── SONG BRIEF ───────────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", marginBottom: "0.35rem" }}>
            3. Creative brief
          </p>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.42)", marginBottom: "1rem" }}>
            Pick an example or write your own visual direction.
          </p>

          <label style={labelStyle}>Quick example</label>
          <select
            value=""
            onChange={(e) => { if (e.target.value) setVisionInput(e.target.value); }}
            style={{ ...selectStyle, marginBottom: "0.75rem" }}
          >
            <option value="">Choose an example (optional)</option>
            {(hasPicked ? VISION_EXAMPLES[category] : MIXED_STARTER_EXAMPLES.map(e => e.text)).map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          <textarea
            value={visionInput}
            onChange={(e) => setVisionInput(e.target.value)}
            rows={3}
            placeholder="Describe the setting, mood, and key imagery for your song..."
            style={{ ...inputStyle, fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "0.75rem" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  if (!effectiveSubject) { toast.error("Please enter a subject or topic first"); return; }
                  if (!visionInput.trim()) { toast.error("Describe your idea first"); return; }
                  if (!project.deity) handleSelectSubject(effectiveSubject);
                  setPromptStatus("idle");
                  setPromptError("");
                  promptGenMutation.mutate({ deity: effectiveSubject, userIdea: visionInput, category: category as any, mood: mood || undefined, llmModel });
                }}
                disabled={promptGenMutation.isPending || !visionInput.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: promptGenMutation.isPending ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)",
                  color: promptGenMutation.isPending ? "rgba(236,236,241,0.35)" : "rgba(236,236,241,0.82)",
                  border: "1px solid rgba(255,255,255,0.16)", borderRadius: "0.5rem",
                  fontWeight: 600, fontSize: "0.875rem",
                  cursor: promptGenMutation.isPending || !visionInput.trim() ? "not-allowed" : "pointer",
                  opacity: !visionInput.trim() ? 0.5 : 1,
                  transition: "all 200ms",
                  flexShrink: 0,
                }}
              >
                {promptGenMutation.isPending
                  ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                  : <><Wand2 size={14} /> Generate Extra Direction</>
                }
              </button>

              {promptGenMutation.isPending && (
                <span style={{ fontSize: "0.78rem", color: "rgba(236,236,241,0.6)", fontStyle: "italic" }}>
                  In progress...
                </span>
              )}
              {!promptGenMutation.isPending && promptStatus === "done" && (
                <span style={{ fontSize: "0.78rem", color: "oklch(0.72 0.18 145)", fontWeight: 600 }}>
                  ✓ Done — directive ready below
                </span>
              )}
              {!promptGenMutation.isPending && promptStatus === "error" && (
                <span style={{ fontSize: "0.78rem", color: "oklch(0.70 0.18 25)", fontWeight: 600 }}>
                  ✗ {promptError}
                </span>
              )}
          </div>
        </div>

        {/* ── CUSTOM DIRECTION ─────────────────────────── */}
        <div style={{ ...panel, marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", marginBottom: "0.25rem" }}>
            4. Extra direction <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>(optional)</span>
          </p>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.85rem" }}>
            Add must-have phrases, structure, or style rules.
          </p>

          {customPrompt && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.75rem", color: isVisionDirective ? "rgba(236,236,241,0.85)" : "rgba(255,255,255,0.35)", fontStyle: "italic", margin: 0 }}>
                {isVisionDirective ? "✓ AI-generated directive — you can edit it here." : "Custom direction active"}
              </p>
              <button
                onClick={() => { setCustomPrompt(""); setIsVisionDirective(false); }}
                style={{ background: "none", border: "none", padding: "0 0.25rem", fontSize: "0.7rem", color: "rgba(255,80,80,0.62)", cursor: "pointer", fontWeight: 600 }}
              >
                Clear
              </button>
            </div>
          )}

          <textarea
            value={customPrompt}
            onChange={(e) => { setCustomPrompt(e.target.value); setIsVisionDirective(false); }}
            rows={3}
            placeholder="Add specific style or structure instructions here..."
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
                        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(236,236,241,0.65)"; }}
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
                        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(236,236,241,0.65)"; }}
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
              Direction saved — click <strong style={{ color: "rgba(236,236,241,0.6)" }}>Regenerate lyrics</strong> above to apply it.
            </p>
          )}
          <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={handleGenerateMasterPrompt}
              disabled={isMasterPromptGenerating || !effectiveSubject}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                background: isMasterPromptGenerating || !effectiveSubject ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)",
                color: isMasterPromptGenerating || !effectiveSubject ? "rgba(236,236,241,0.35)" : "rgba(236,236,241,0.82)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: isMasterPromptGenerating || !effectiveSubject ? "not-allowed" : "pointer",
                opacity: !effectiveSubject ? 0.5 : 1,
                transition: "all 200ms",
              }}
            >
              {isMasterPromptGenerating
                ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                : <><Wand2 size={14} /> Generate Creative Direction</>
              }
            </button>
          </div>
        </div>

        <div style={{ ...panel, marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", margin: 0 }}>5. Creative Direction (Master Prompt)</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", margin: "0.25rem 0 0" }}>
                Generate or edit the master direction before lyrics.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {masterPromptEditable.trim() && (
                <button
                  onClick={() => {
                    generateMasterPrompt(effectiveSubject, "", customPrompt.trim(), category, mood, llmModel, languageStyle, outputType, duration)
                      .then((prompt) => {
                        if (prompt) setMasterPromptEditable(prompt);
                      });
                  }}
                  disabled={isMasterPromptGenerating}
                  style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(236,236,241,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.5rem", padding: "0.55rem 0.9rem", cursor: "pointer" }}
                >
                  {isMasterPromptGenerating ? "Regenerating..." : "Regenerate"}
                </button>
              )}
            </div>
          </div>
          <textarea
            value={masterPromptEditable}
            onChange={(e) => {
              setMasterPromptEditable(e.target.value);
              if (e.target.value.trim()) setShowMasterPromptPhase(true);
            }}
            rows={8}
            placeholder="Creative Direction will appear here. You can also write your own direction manually."
            style={{ ...inputStyle, color: "#ececf1", fontFamily: "monospace", fontSize: "0.875rem", lineHeight: "1.6", minHeight: "200px" }}
          />
          {!effectiveSubject && (
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", margin: "0.75rem 0 0" }}>
              Enter a subject or topic above to enable generation.
            </p>
          )}
          {effectiveSubject && !masterPromptEditable.trim() && !isMasterPromptGenerating && (
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", margin: "0.75rem 0 0" }}>
              Click Generate, or type your own creative direction directly in the box.
            </p>
          )}
        </div>

        <button
          onClick={handleGenerateLyricsWithMasterPrompt}
          disabled={isGenerating || !masterPromptEditable.trim()}
          style={{ ...primaryBtn(isGenerating || !masterPromptEditable.trim()), width: "100%", marginBottom: "1rem" }}
        >
          {isGenerating
            ? <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Generating lyrics...</>
            : <><Zap size={18} /> GENERATE LYRICS FROM DIRECTION</>
          }
        </button>


        {/* ── GENERATED LYRICS ─────────────────────────── */}
        {hasLyrics && (
          <>
            {/* Stale-lyrics warning — shown when lyrics are from a previous session */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", marginBottom: "0.75rem", background: "rgba(255,165,0,0.07)", border: "1px solid rgba(255,165,0,0.25)", borderRadius: "0.65rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,165,0,0.85)" }}>
                ⚠ Lyrics from a previous song are loaded. Generate new lyrics above or clear to start fresh.
              </span>
              <button
                onClick={() => {
                  if (window.confirm("This will clear the current lyrics, title, and scenes. Continue?")) {
                    resetProject();
                    setSubjectInput("");
                    setTitleInput("");
                    setVisionInput("");
                    setCustomPrompt("");
                    setIsVisionDirective(false);
                    setPromptStatus("idle");
                  }
                }}
                style={{ fontSize: "0.73rem", fontWeight: 700, color: "rgba(255,80,80,0.8)", background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: "0.375rem", padding: "0.3rem 0.75rem", cursor: "pointer" }}
              >
                Clear &amp; start fresh
              </button>
            </div>

            <div style={{ ...panel, marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", margin: "0 0 0.25rem" }}>6. Generated Lyrics</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", margin: "0 0 0.75rem" }}>
                Edit freely — changes save automatically.
              </p>
              <textarea
                value={sanitizeLyrics(project.lyrics)}
                onChange={(e) => setLyrics(e.target.value)}
                rows={14}
                style={{ ...inputStyle, color: "#ececf1", fontFamily: "monospace", fontSize: "0.875rem", lineHeight: "1.7", minHeight: "260px" }}
              />
              {/* Action row — below the content so the flow is: read → act */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {canUndoLyrics && (
                  <button
                    onClick={() => { undoLyrics(); toast.success("Restored previous lyrics"); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.9rem", background: "rgba(255,150,50,0.12)", color: "#ff9632", border: "1px solid rgba(255,150,50,0.35)", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Undo2 size={13} /> Undo last change
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(sanitizeLyrics(project.lyrics), "Lyrics")}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.9rem", background: "rgba(255,255,255,0.06)", color: "rgba(236,236,241,0.82)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Copy size={13} /> Copy lyrics
                </button>
                <button
                  onClick={() => { if (window.confirm("Clear these lyrics?")) setLyrics(""); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.9rem", background: "rgba(255,80,80,0.08)", color: "rgba(255,80,80,0.7)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
                >
                  Clear lyrics
                </button>
              </div>
            </div>

            {/* Iterate — separate card so it reads as a distinct action */}
            <div style={{ ...panel, marginBottom: "1rem" }}>
              <button
                onClick={() => setShowIterate(!showIterate)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: showIterate ? "rgba(236,236,241,0.82)" : "rgba(255,255,255,0.6)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 700, padding: 0, width: "100%", textAlign: "left" }}
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
                    placeholder={`e.g., "Make the Pallavi shorter and more catchy"\ne.g., "The Charanam feels too long, trim it to 4 lines"\ne.g., "Add more cultural imagery, include the temple bells"`}
                    style={{ ...inputStyle, fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "0.75rem" }}
                  />
                  <button
                    onClick={handleIterate}
                    disabled={isGenerating || !iterateFeedback.trim()}
                    style={secondaryBtn(isGenerating || !iterateFeedback.trim())}
                  >
                    {isGenerating
                      ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Regenerating...</>
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
        {/* ── MASTER PROMPT ───────────────────────────────── */}
        {masterPrompt && project.lyrics && (
          <div style={{ marginBottom: "1.75rem" }}>
            <MasterPromptPanel
              masterPrompt={masterPrompt}
              isOpen={showMasterPromptPanel}
              onToggle={() => setShowMasterPromptPanel(!showMasterPromptPanel)}
              onRefine={(feedback) => refineMasterPrompt(feedback, category, llmModel)}
              isRefining={isMasterPromptRefining}
            />
          </div>
        )}

        {showSunoPanel && sunoStyle && outputType !== "lyrics_only" && (
          <div style={{ ...panel, marginBottom: "1.75rem" }}>
            {/* Header — title + description only */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
              <Music size={17} style={{ color: "rgba(236,236,241,0.82)" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(236,236,241,0.82)", margin: 0 }}>SUNO music style</p>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem" }}>
              A ready-to-paste style prompt for SUNO. Refine to localize instruments or tempo.
            </p>

            {/* Style text first — read it, then act on it */}
            <pre style={{ margin: 0, padding: "0.875rem", background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "rgba(236,236,241,0.82)", fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 600, lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {sunoStyleText(sunoStyle)}
            </pre>

            {/* Action buttons — below the style text */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                onClick={() => copyToClipboard(sunoStyleText(sunoStyle), "SUNO style")}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.06)", color: "rgba(236,236,241,0.82)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
              >
                <Copy size={13} /> Copy for SUNO
              </button>
              <button
                onClick={() => setShowSunoRefine(!showSunoRefine)}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.62)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
              >
                {showSunoRefine ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                Refine style with AI
              </button>
            </div>

            {showSunoRefine && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
                    ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Refining...</>
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
                background: canContinue ? "linear-gradient(135deg, #00d4ff 0%, #39ff14 100%)" : "rgba(255,255,255,0.08)",
                color: canContinue ? "#000" : "rgba(255,255,255,0.3)",
                border: "none", borderRadius: "0.65rem",
                fontWeight: 700, fontSize: "1rem",
                cursor: canContinue ? "pointer" : "not-allowed",
                transition: "all 200ms",
              }}
            >
              Continue to audio upload
            </button>
            {!canContinue && (
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.32)", textAlign: "center", marginTop: "0.5rem" }}>
                {!project.title.trim() ? "Add a song title above to continue." : "Add or paste lyrics first, then continue."}
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #0a0e27; }
        .concept-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }
        .concept-grid-full {
          grid-column: 1 / -1;
        }
        @media (max-width: 760px) {
          .concept-grid {
            grid-template-columns: 1fr;
          }
          .concept-grid-full {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}
