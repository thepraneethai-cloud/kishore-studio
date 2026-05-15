// ============================================================
// DESIGN: "Digital Sanctum" — Step 4: Music Generation Tips
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES } from "@/lib/studioData";
import { ChevronRight, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SUNO_TIPS = [
  { issue: "Weird sounds (rrr, yeyy)", fix: "Add [Note: smooth melodic flow, no distortion] at the end of your style prompt" },
  { issue: "Wrong tempo", fix: "Be explicit: write 'Slow 65 BPM' or 'Medium 90 BPM' in the style section" },
  { issue: "Voice sounds robotic", fix: "Add 'warm human vocals, natural breath' to your vocal style description" },
  { issue: "Instruments don't sound right", fix: "List instruments in order of prominence: 'Veena (lead), Mridangam (rhythm), Flute (accent)'" },
  { issue: "Telugu pronunciation off", fix: "Add phonetic hints in brackets next to difficult words" },
  { issue: "Too short / cuts off", fix: "Use [Outro] tag at the end with 'fade out slowly' instruction" },
];

const ITERATION_GUIDE = [
  "Generate 3–5 versions of the same prompt",
  "Listen to each version fully before judging",
  "Note which version has the best voice quality",
  "Note which version has the best instrument balance",
  "Mix elements: use best voice from V2, best instruments from V4",
  "Export the final version as MP3 at highest quality",
];

export default function Step4MusicPrompt() {
  const { project, setActiveStep, markStepComplete } = useProject();
  const deity = DEITIES.find((d) => d.key === project.deity);

  const handleContinue = () => {
    markStepComplete(4);
    setActiveStep(5);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)" }}>
          Step 4
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.92 0.018 75)" }}>
          Generate Music in SUNO
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          Use the prompt from Step 3 in SUNO AI. Here's how to iterate until you get the perfect result.
        </p>
      </div>

      {/* SUNO Link */}
      <div
        className="flex items-center justify-between p-4 rounded-lg"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75 / 0.1), oklch(0.65 0.14 65 / 0.1))",
          border: "1px solid oklch(0.72 0.12 75 / 0.3)",
        }}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: "oklch(0.80 0.12 78)" }}>
            Open SUNO AI
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
            Paste your prompt from Step 3 and generate music
          </p>
        </div>
        <a
          href="https://suno.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
            color: "oklch(0.12 0.015 55)",
          }}
        >
          suno.com
          <ExternalLink size={13} />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Troubleshooting */}
        <div className="shrine-panel p-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
            Common Issues & Fixes
          </p>
          <div className="space-y-3">
            {SUNO_TIPS.map((tip, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-start gap-2">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.14 65)" }} />
                  <p className="text-xs font-medium" style={{ color: "oklch(0.75 0.015 70)" }}>
                    {tip.issue}
                  </p>
                </div>
                <p className="text-xs pl-5" style={{ color: "oklch(0.55 0.012 65)" }}>
                  → {tip.fix}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Iteration Guide */}
        <div className="space-y-4">
          <div className="shrine-panel p-4 space-y-3">
            <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              Iteration Workflow
            </p>
            <ol className="space-y-2">
              {ITERATION_GUIDE.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-xs" style={{ color: "oklch(0.60 0.015 68)" }}>
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.72 0.12 75)" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Quality checklist */}
          <div className="shrine-panel p-4 space-y-3">
            <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>
              Final Audio Checklist
            </p>
            {[
              "Voice sounds natural and devotional",
              "No weird artifacts (rrr, yeyy, glitches)",
              "Correct tempo throughout",
              "Instruments are balanced",
              "Telugu pronunciation is clear",
              "Exported as MP3 (high quality)",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.60 0.015 68)" }}>
                <CheckCircle2 size={13} style={{ color: "oklch(0.65 0.14 65)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio file note */}
      <div
        className="p-3 rounded-lg text-sm"
        style={{
          background: "oklch(0.72 0.12 75 / 0.08)",
          border: "1px solid oklch(0.72 0.12 75 / 0.2)",
          color: "oklch(0.70 0.015 70)",
        }}
      >
        <strong style={{ color: "oklch(0.80 0.12 78)" }}>Once you have your final MP3:</strong> Save it as your base audio asset. 
        The next steps will build your visual storyboard and video prompts around this audio file.
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))",
          color: "oklch(0.12 0.015 55)",
        }}
      >
        Continue to Scene Breakdown
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
