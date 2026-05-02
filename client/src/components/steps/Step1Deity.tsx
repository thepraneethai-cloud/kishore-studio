// ============================================================
// DESIGN: "Digital Sanctum" — Step 1: Deity / Theme Selector
// Text input with AI suggestions
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function Step1Deity() {
  const { project, setDeity, setTitle, setActiveStep, markStepComplete } = useProject();
  const [deityInput, setDeityInput] = useState(project.deity || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Simulate AI suggestions based on input
  const generateSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate suggestions based on input
    const allSuggestions = [
      // Hindu deities
      "Venkateswara", "Ganesha", "Lakshmi", "Shiva", "Brahma",
      "Durga", "Kali", "Saraswati", "Hanuman", "Krishna",
      "Radha", "Vishnu", "Indra", "Agni", "Vayu",
      // Themes
      "Divine Love", "Protection", "Prosperity", "Wisdom", "Power",
      "Devotion", "Gratitude", "Meditation", "Celebration", "Healing",
      // Mythology
      "Ramayana", "Mahabharata", "Bhagavad Gita", "Vedas", "Puranas",
    ];

    const filtered = allSuggestions.filter(s =>
      s.toLowerCase().includes(input.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 6)); // Show top 6 suggestions
    setIsLoadingSuggestions(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      generateSuggestions(deityInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [deityInput]);

  const handleSelect = (suggestion: string) => {
    setDeityInput(suggestion);
    setDeity(suggestion);
    setShowSuggestions(false);
    if (!project.title) {
      setTitle(`${suggestion} Devotional Song`);
    }
  };

  const handleContinue = () => {
    if (deityInput) {
      setDeity(deityInput);
      markStepComplete(1);
      setActiveStep(2);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "oklch(0.65 0.14 65)", fontFamily: "'Cinzel', serif" }}>
          Step 1
        </p>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.92 0.018 75)" }}>
          Select Deity & Theme
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.60 0.015 68)" }}>
          Type any deity, theme, or mythology — AI will suggest relevant options.
        </p>
      </div>

      {/* Deity/Theme Input with AI Suggestions */}
      <div className="shrine-panel p-4 space-y-3">
        <label className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
          <Sparkles size={16} style={{ color: "oklch(0.80 0.12 78)" }} />
          Deity, Theme, or Mythology
        </label>

        {/* Input field */}
        <div className="relative">
          <input
            type="text"
            value={deityInput}
            onChange={(e) => {
              setDeityInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g., Venkateswara, Divine Love, Ramayana..."
            className="sanctum-input pr-10"
          />
          {isLoadingSuggestions && (
            <Loader2 size={16} className="absolute right-3 top-2.5 animate-spin" style={{ color: "oklch(0.72 0.12 75)" }} />
          )}
        </div>

        {/* AI Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="space-y-1.5 border-t border-oklch(0.22 0.022 55) pt-3">
            <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
              Suggestions:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSelect(suggestion)}
                  className="px-3 py-2 rounded text-xs text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: deityInput === suggestion
                      ? "oklch(0.72 0.12 75 / 0.2)"
                      : "oklch(0.22 0.022 55)",
                    color: deityInput === suggestion
                      ? "oklch(0.80 0.12 78)"
                      : "oklch(0.65 0.14 65)",
                    border: deityInput === suggestion
                      ? "1px solid oklch(0.72 0.12 75)"
                      : "1px solid oklch(0.28 0.025 58)",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Helper text */}
        <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
          💡 Tip: You can enter any deity name, theme, or mythology story. The AI will help generate relevant content.
        </p>
      </div>

      {/* Song Title Input */}
      {deityInput && (
        <div className="shrine-panel p-4 space-y-3 fade-in">
          <label className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
            Song Title
          </label>
          <input
            type="text"
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g., ${deityInput} Devotional Song`}
            className="sanctum-input"
          />
          <p className="text-xs" style={{ color: "oklch(0.50 0.012 65)" }}>
            This will be used for YouTube title, thumbnail, and metadata.
          </p>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!deityInput}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 w-full justify-center",
          deityInput
            ? "hover:opacity-90 hover:scale-[1.02]"
            : "opacity-40 cursor-not-allowed"
        )}
        style={{
          background: deityInput
            ? "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.65 0.14 65))"
            : "oklch(0.22 0.018 52)",
          color: "oklch(0.12 0.015 55)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        Continue to Lyrics
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
