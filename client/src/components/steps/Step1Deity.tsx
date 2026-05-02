// ============================================================
// STEP 1: Deity / Theme Selector
// Neumorphic Modern design with text input and AI suggestions
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <p style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.25rem",
          color: "var(--text-tertiary)",
          fontWeight: "600",
        }}>
          Step 1 of 9
        </p>
        <h2 style={{
          fontSize: "2rem",
          fontWeight: "700",
          marginBottom: "0.5rem",
          color: "var(--text-primary)",
        }}>
          Select Deity & Theme
        </h2>
        <p style={{
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
        }}>
          Type any deity, theme, or mythology — AI will suggest relevant options.
        </p>
      </div>

      {/* Input Card */}
      <div style={{
        backgroundColor: "var(--bg-tertiary)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}>
        <label style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <Sparkles size={16} style={{ color: "var(--accent-primary)" }} />
          Deity, Theme, or Mythology
        </label>

        {/* Input field */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={deityInput}
            onChange={(e) => {
              setDeityInput(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder="e.g., Venkateswara, Divine Love, Ramayana..."
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1rem",
              border: "none",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-inset)",
              transition: "all var(--transition-base)",
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-inset), 0 0 0 3px var(--accent-primary)";
              setShowSuggestions(true);
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-inset)";
            }}
          />
          {isLoadingSuggestions && (
            <Loader2 
              size={16} 
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "0.75rem",
                color: "var(--accent-primary)",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
        </div>

        {/* AI Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            borderTop: "1px solid var(--bg-secondary)",
            paddingTop: "1rem",
          }}>
            <p style={{
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              fontWeight: "600",
              textTransform: "uppercase",
            }}>
              Suggestions
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.5rem",
            }}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSelect(suggestion)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    textAlign: "left",
                    transition: "all var(--transition-base)",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: deityInput === suggestion
                      ? "var(--accent-primary)"
                      : "var(--bg-secondary)",
                    color: deityInput === suggestion
                      ? "white"
                      : "var(--text-secondary)",
                    boxShadow: deityInput === suggestion
                      ? "var(--shadow-md)"
                      : "var(--shadow-sm)",
                    fontWeight: deityInput === suggestion ? "600" : "500",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = deityInput === suggestion
                      ? "var(--shadow-md)"
                      : "var(--shadow-sm)";
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Helper text */}
        <p style={{
          fontSize: "0.75rem",
          color: "var(--text-tertiary)",
        }}>
          💡 Tip: You can enter any deity name, theme, or mythology story. The AI will help generate relevant content.
        </p>
      </div>

      {/* Song Title Input */}
      {deityInput && (
        <div style={{
          backgroundColor: "var(--bg-tertiary)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          animation: "fadeIn var(--transition-base)",
        }}>
          <label style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "var(--text-primary)",
          }}>
            Song Title
          </label>
          <input
            type="text"
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g., ${deityInput} Devotional Song`}
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1rem",
              border: "none",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-inset)",
              transition: "all var(--transition-base)",
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-inset), 0 0 0 3px var(--accent-primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-inset)";
            }}
          />
          <p style={{
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
          }}>
            This will be used for YouTube title, thumbnail, and metadata.
          </p>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!deityInput}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "1rem 1.5rem",
          borderRadius: "var(--radius-md)",
          fontSize: "1rem",
          fontWeight: "600",
          border: "none",
          cursor: deityInput ? "pointer" : "not-allowed",
          transition: "all var(--transition-base)",
          background: deityInput
            ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
            : "var(--bg-secondary)",
          color: deityInput ? "white" : "var(--text-tertiary)",
          boxShadow: deityInput ? "var(--shadow-md)" : "var(--shadow-sm)",
          opacity: deityInput ? 1 : 0.5,
          width: "100%",
        }}
        onMouseEnter={(e) => {
          if (deityInput) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-lg)";
          }
        }}
        onMouseLeave={(e) => {
          if (deityInput) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }
        }}
      >
        Continue to Lyrics
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
