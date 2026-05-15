// ============================================================
// DESIGN: "Digital Sanctum" — Step 3: SUNO Music Style Builder
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, TEMPO_OPTIONS, INSTRUMENT_OPTIONS, MOOD_OPTIONS } from "@/lib/studioData";
import { ChevronRight, Copy, Check, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { MasterPromptPanel } from "@/components/MasterPromptPanel";
import { cn } from "@/lib/utils";

const VOCAL_OPTIONS = [
  "Male devotional tenor",
  "Female classical soprano",
  "Male baritone bhajan",
  "Female mezzo-soprano",
  "Chorus / group vocals",
  "Male carnatic classical",
  "Female carnatic classical",
];

const STYLE_PRESETS = [
  { label: "Slow Bhajan", tempo: "slow", style: "Slow devotional bhajan", mood: "Divine & Calm", instruments: ["Harmonium", "Tabla", "Flute"] },
  { label: "Carnatic Classical", tempo: "classical", style: "Carnatic classical keertana", mood: "Meditative & Peaceful", instruments: ["Veena", "Mridangam", "Violin"] },
  { label: "Energetic Keertana", tempo: "energetic", style: "Energetic devotional keertana", mood: "Joyful & Celebratory", instruments: ["Mridangam", "Nadaswaram", "Bells"] },
  { label: "Meditative", tempo: "slow", style: "Meditative mantra chant", mood: "Meditative & Peaceful", instruments: ["Flute", "Santoor", "Veena"] },
];

function buildSunoPrompt(
  style: { tempo: string; style: string; instruments: string[]; mood: string; vocals: string },
  deityName: string,
  lyrics: string,
  masterPrompt?: string
): string {
  const tempoLabel = TEMPO_OPTIONS.find((t) => t.value === style.tempo)?.label || style.tempo;
  const instrList = style.instruments.join(", ");
  const firstLine = lyrics.split("\n").find((l) => l.trim() && !l.startsWith("["))?.trim() || "";

  // Incorporate Master Prompt into SUNO style guidance
  const masterPromptGuidance = masterPrompt
    ? `\n[Master Creative Vision]\n${masterPrompt}\n`
    : "";

  return `[Style: ${style.style}]
[Tempo: ${tempoLabel}]
[Instruments: ${instrList}]
[Mood: ${style.mood}]
[Vocals: ${style.vocals}]
[Language: Telugu]
[Theme: ${deityName} devotional]${masterPromptGuidance}
${lyrics}

[Note: Avoid robotic sounds, maintain smooth melodic flow, traditional South Indian classical feel. Ensure music aligns with the Master Creative Vision above.]`;
}

export default function Step3SunoStyle() {
  const { project, setSunoStyle, setActiveStep, markStepComplete } = useProject();
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);

  const deity = DEITIES.find((d) => d.key === project.deity);
  const { sunoStyle } = project;

  const toggleInstrument = (inst: string) => {
    const current = sunoStyle.instruments;
    if (current.includes(inst)) {
      setSunoStyle({ instruments: current.filter((i) => i !== inst) });
    } else {
      setSunoStyle({ instruments: [...current, inst] });
    }
  };

  const applyPreset = (preset: typeof STYLE_PRESETS[0]) => {
    setSunoStyle({
      tempo: preset.tempo,
      style: preset.style,
      mood: preset.mood,
      instruments: preset.instruments,
    });
    toast.success(`Preset "${preset.label}" applied`);
  };

  const sunoPrompt = deity
    ? buildSunoPrompt(sunoStyle, deity.name, project.lyrics, project.masterPrompt)
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(sunoPrompt);
    setCopied(true);
    toast.success("SUNO prompt copied — paste it into SUNO AI");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    if (sunoStyle.instruments.length === 0) {
      toast.error("Please select at least one instrument");
      return;
    }
    markStepComplete(3);
    setActiveStep(4);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)" }}>
          Step 3
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.92 0.018 75)" }}>
          SUNO Music Style
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          Define the musical style for your SUNO AI generation — tempo, instruments, mood, and vocals. Your Master Prompt will guide the music direction.
        </p>
      </div>

      {/* Master Prompt Reference Panel */}
      {project.masterPrompt && (
        <div className="shrine-panel p-4 space-y-3">
          <button
            onClick={() => setShowMasterPrompt(!showMasterPrompt)}
            className="flex items-center justify-between w-full text-left"
          >
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              📋 Master Creative Vision (Reference)
            </p>
            {showMasterPrompt ? (
              <ChevronUp size={16} style={{ color: "oklch(0.65 0.14 65)" }} />
            ) : (
              <ChevronDown size={16} style={{ color: "oklch(0.65 0.14 65)" }} />
            )}
          </button>
          {showMasterPrompt && (
            <div
              className="text-xs leading-relaxed p-3 rounded"
              style={{
                background: "oklch(0.14 0.016 52)",
                color: "oklch(0.70 0.015 68)",
                border: "1px solid oklch(0.24 0.020 55)",
              }}
            >
              {project.masterPrompt}
            </div>
          )}
        </div>
      )}

      {/* Quick Presets */}
      <div className="shrine-panel p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: "oklch(0.72 0.12 75)" }}>
          Quick Presets
        </p>
        <div className="grid grid-cols-4 gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="text-xs py-2 px-3 rounded text-center transition-all hover:scale-[1.02]"
              style={{
                background: sunoStyle.style === preset.style
                  ? "linear-gradient(135deg, oklch(0.72 0.12 75 / 0.2), oklch(0.65 0.14 65 / 0.2))"
                  : "oklch(0.22 0.018 52)",
                border: sunoStyle.style === preset.style
                  ? "1px solid oklch(0.72 0.12 75 / 0.5)"
                  : "1px solid oklch(0.28 0.025 58)",
                color: sunoStyle.style === preset.style
                  ? "oklch(0.72 0.12 75)"
                  : "oklch(0.65 0.015 68)",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Tempo + Style + Mood + Vocals */}
        <div className="space-y-4">
          {/* Tempo */}
          <div className="shrine-panel p-4 space-y-3">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              Tempo
            </p>
            <div className="space-y-2">
              {TEMPO_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: sunoStyle.tempo === opt.value ? "oklch(0.72 0.12 75)" : "oklch(0.35 0.020 58)",
                      background: sunoStyle.tempo === opt.value ? "oklch(0.72 0.12 75)" : "transparent",
                    }}
                    onClick={() => setSunoStyle({ tempo: opt.value })}
                  >
                    {sunoStyle.tempo === opt.value && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.12 0.015 55)" }} />
                    )}
                  </div>
                  <span
                    className="text-sm"
                    style={{ color: sunoStyle.tempo === opt.value ? "oklch(0.85 0.018 75)" : "oklch(0.60 0.015 68)" }}
                    onClick={() => setSunoStyle({ tempo: opt.value })}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="shrine-panel p-4 space-y-3">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              Mood
            </p>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSunoStyle({ mood })}
                  className="text-xs px-2.5 py-1.5 rounded transition-all"
                  style={{
                    background: sunoStyle.mood === mood ? "oklch(0.65 0.14 65 / 0.25)" : "oklch(0.22 0.018 52)",
                    border: sunoStyle.mood === mood ? "1px solid oklch(0.65 0.14 65 / 0.6)" : "1px solid oklch(0.28 0.025 58)",
                    color: sunoStyle.mood === mood ? "oklch(0.72 0.12 75)" : "oklch(0.60 0.015 68)",
                  }}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Vocals */}
          <div className="shrine-panel p-4 space-y-3">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              Vocal Style
            </p>
            <select
              value={sunoStyle.vocals}
              onChange={(e) => setSunoStyle({ vocals: e.target.value })}
              className="sanctum-input"
              style={{ padding: "0.5rem 0.75rem" }}
            >
              {VOCAL_OPTIONS.map((v) => (
                <option key={v} value={v} style={{ background: "oklch(0.18 0.016 52)" }}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Instruments */}
        <div className="shrine-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              Instruments
            </p>
            <span className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
              {sunoStyle.instruments.length} selected
            </span>
          </div>
          {deity && (
            <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
              Recommended for {deity.name}: {deity.instruments.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {INSTRUMENT_OPTIONS.map((inst) => {
              const isSelected = sunoStyle.instruments.includes(inst);
              const isRecommended = deity?.instruments.includes(inst);
              return (
                <button
                  key={inst}
                  onClick={() => toggleInstrument(inst)}
                  className="text-xs px-2.5 py-1.5 rounded transition-all"
                  style={{
                    background: isSelected
                      ? "oklch(0.72 0.12 75 / 0.2)"
                      : isRecommended
                      ? "oklch(0.22 0.025 58)"
                      : "oklch(0.20 0.016 52)",
                    border: isSelected
                      ? "1px solid oklch(0.72 0.12 75 / 0.7)"
                      : isRecommended
                      ? "1px solid oklch(0.65 0.14 65 / 0.4)"
                      : "1px solid oklch(0.25 0.020 55)",
                    color: isSelected
                      ? "oklch(0.80 0.12 78)"
                      : isRecommended
                      ? "oklch(0.70 0.12 72)"
                      : "oklch(0.55 0.012 65)",
                  }}
                >
                  {isRecommended && !isSelected && "★ "}{inst}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generated SUNO Prompt */}
      <div className="shrine-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
            Generated SUNO Prompt
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                background: "oklch(0.22 0.018 52)",
                color: "oklch(0.65 0.015 68)",
                border: "1px solid oklch(0.28 0.025 58)",
              }}
            >
              {showPrompt ? "Hide" : "Preview"}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                background: copied ? "oklch(0.72 0.12 75 / 0.2)" : "oklch(0.22 0.018 52)",
                color: copied ? "oklch(0.72 0.12 75)" : "oklch(0.65 0.015 68)",
                border: `1px solid ${copied ? "oklch(0.72 0.12 75 / 0.5)" : "oklch(0.28 0.025 58)"}`,
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy to SUNO"}
            </button>
          </div>
        </div>
        {showPrompt && (
          <pre
            className="text-xs whitespace-pre-wrap leading-relaxed p-3 rounded"
            style={{
              background: "oklch(0.14 0.016 52)",
              color: "oklch(0.70 0.015 68)",
              border: "1px solid oklch(0.24 0.020 55)",
              fontFamily: "'Source Sans 3', sans-serif",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {sunoPrompt}
          </pre>
        )}
        {!showPrompt && (
          <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
            Click "Copy to SUNO" to copy the full prompt with your lyrics and style settings.
          </p>
        )}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={sunoStyle.instruments.length === 0}
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
          color: "oklch(0.12 0.015 55)",
        }}
      >
        Continue to Music Prompt
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
