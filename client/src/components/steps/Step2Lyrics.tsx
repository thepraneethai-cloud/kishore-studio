// ============================================================
// DESIGN: "Digital Sanctum" — Step 2: Telugu Lyrics Generator
// ============================================================
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, LYRICS_TEMPLATES, DeityKey } from "@/lib/studioData";
import { ChevronRight, Copy, Check, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";

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

export default function Step2Lyrics() {
  const { project, setLyrics, setActiveStep, markStepComplete } = useProject();
  const [copied, setCopied] = useState(false);

  const deity = DEITIES.find((d) => d.key === project.deity);

  const loadTemplate = () => {
    if (project.deity) {
      setLyrics(LYRICS_TEMPLATES[project.deity]);
      toast.success("Template loaded — customize it for your song!");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(project.lyrics);
    setCopied(true);
    toast.success("Lyrics copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    if (project.lyrics.trim().length > 20) {
      markStepComplete(2);
      setActiveStep(3);
    } else {
      toast.error("Please write or load some lyrics first");
    }
  };

  const wordCount = project.lyrics.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = project.lyrics.trim().split("\n").filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 2
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          Write Telugu Lyrics
        </h2>
        {deity && (
          <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
            Composing for <span style={{ color: "oklch(0.72 0.12 75)" }}>{deity.name}</span> — {deity.mood}
          </p>
        )}
      </div>

      {/* Two-column layout: editor + tips */}
      <div className="grid grid-cols-5 gap-4">
        {/* Lyrics Editor — 3 cols */}
        <div className="col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
              Lyrics Editor
            </span>
            <div className="flex gap-2">
              <button
                onClick={loadTemplate}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  background: "oklch(0.22 0.018 52)",
                  color: "oklch(0.65 0.14 65)",
                  border: "1px solid oklch(0.28 0.025 58)",
                }}
              >
                <FileText size={12} />
                Load Template
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  background: "oklch(0.22 0.018 52)",
                  color: copied ? "oklch(0.72 0.12 75)" : "oklch(0.60 0.015 68)",
                  border: "1px solid oklch(0.28 0.025 58)",
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <textarea
            value={project.lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={`Write your Telugu devotional lyrics here...\n\n[Pallavi]\nగోవింద గోవింద...\n\n[Charanam 1]\n...`}
            className="sanctum-input telugu-text"
            rows={18}
            style={{ minHeight: "360px" }}
          />

          <div className="flex gap-4 text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
            <span>{wordCount} words</span>
            <span>{lineCount} lines</span>
            <span>~{Math.round(wordCount / 40)} min read</span>
          </div>
        </div>

        {/* Tips Panel — 2 cols */}
        <div className="col-span-2 space-y-3">
          {/* Structure guide */}
          <div className="shrine-panel p-3">
            <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
              Song Structure
            </p>
            <pre
              className="text-xs whitespace-pre-wrap leading-relaxed"
              style={{ color: "oklch(0.60 0.015 68)", fontFamily: "'Source Sans 3', sans-serif" }}
            >
              {STRUCTURE_GUIDE}
            </pre>
          </div>

          {/* Deity-specific tips */}
          {deity && project.deity && (
            <div className="shrine-panel p-3">
              <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
                {deity.name} Writing Tips
              </p>
              <ul className="space-y-2">
                {WRITING_TIPS[project.deity as DeityKey].map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "oklch(0.60 0.015 68)" }}>
                    <span style={{ color: "oklch(0.65 0.14 65)" }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Telugu keyboard hint */}
          <div className="shrine-panel p-3">
            <p className="text-xs font-semibold mb-1.5" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
              Telugu Input Tip
            </p>
            <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
              Use Google Input Tools or Windows Telugu keyboard. You can also paste lyrics from Google Docs or Word.
            </p>
          </div>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={project.lyrics.trim().length < 20}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
          color: "oklch(0.12 0.015 55)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        Continue to SUNO Style
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
