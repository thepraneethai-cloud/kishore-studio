// ============================================================
// STEP 1: Deity / Theme Selector
// Glassmorphism design with vibrant accents and frosted glass
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
      "Parvati", "Nandi", "Kartikeya", "Murugan", "Govinda",
      "Hari", "Narayana", "Balaji", "Tirupati", "Srinivasa",
      "Jagannath", "Rameswaram", "Somnath", "Kedarnath", "Badrinath",
      "Kashi Vishwanath", "Mahakaleshwar", "Omkareshwar", "Ujjain", "Dwarka",
      "Annapurna", "Kamakshi", "Meenakshi", "Vaishno Devi", "Chamundeshwari",
      "Bhagavati", "Tripura Sundari", "Devi Mahatmya", "Ayyappa", "Subrahmanya",
      // Themes
      "Divine Love", "Protection", "Prosperity", "Wisdom", "Power",
      "Devotion", "Gratitude", "Meditation", "Celebration", "Healing",
      "Courage", "Compassion", "Strength", "Peace", "Bliss",
      // Mythology
      "Ramayana", "Mahabharata", "Bhagavad Gita", "Vedas", "Puranas",
      "Ramayan", "Mahabharat", "Upanishads", "Rig Veda", "Yajur Veda",
      "Atharva Veda", "Sama Veda", "Brahma Sutras", "Yoga Sutras",
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

  const normalizeDeityKey = (name: string): string => {
    const nameMap: Record<string, string> = {
      "venkateswara": "venkateswara",
      "ganesha": "ganesha",
      "lakshmi": "lakshmi",
      "shiva": "shiva",
    };
    const normalized = name.toLowerCase();
    return nameMap[normalized] || name;
  };

  const handleSelect = (suggestion: string) => {
    setDeityInput(suggestion);
    setDeity(normalizeDeityKey(suggestion));
    setShowSuggestions(false);
    if (!project.title) {
      setTitle(`${suggestion} Devotional Song`);
    }
  };

  const handleContinue = () => {
    if (deityInput) {
      setDeity(normalizeDeityKey(deityInput));
      markStepComplete(1);
      setActiveStep(2);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div>
        <p style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.5rem",
          color: "var(--text-tertiary)",
          fontWeight: "700",
        }}>
          Step 1 of 8
        </p>
        <h2 style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          marginBottom: "1rem",
          color: "var(--text-primary)",
          background: "linear-gradient(135deg, #00d4ff, #ff006e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Select Deity & Theme
        </h2>
        <p style={{
          fontSize: "1rem",
          color: "var(--text-secondary)",
        }}>
          Type any deity, theme, or mythology — AI will suggest relevant options.
        </p>
      </div>

      {/* Input Card - Glass Effect */}
      <div className="glass-card accent-blue" style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}>
        <label style={{
          fontSize: "0.875rem",
          fontWeight: "700",
          color: "var(--accent-blue)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          <Sparkles size={18} style={{ color: "var(--accent-blue)" }} />
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
              border: "1px solid rgba(0, 212, 255, 0.3)",
              borderRadius: "var(--radius-md)",
              background: "rgba(0, 212, 255, 0.05)",
              color: "var(--text-primary)",
              transition: "all var(--transition-base)",
              fontFamily: "'Inter', sans-serif",
              backdropFilter: "blur(10px)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-blue)";
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.3)";
              setShowSuggestions(true);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.3)";
              e.currentTarget.style.background = "rgba(0, 212, 255, 0.05)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {isLoadingSuggestions && (
            <Loader2 
              size={18} 
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--accent-blue)",
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
            gap: "1rem",
            borderTop: "1px solid rgba(0, 212, 255, 0.2)",
            paddingTop: "1rem",
          }}>
            <p style={{
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              ✨ AI Suggestions
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.75rem",
            }}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSelect(suggestion)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    textAlign: "left",
                    transition: "all var(--transition-base)",
                    border: deityInput === suggestion
                      ? "1.5px solid var(--accent-blue)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    backgroundColor: deityInput === suggestion
                      ? "rgba(0, 212, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: deityInput === suggestion
                      ? "var(--accent-blue)"
                      : "var(--text-secondary)",
                    backdropFilter: "blur(10px)",
                    fontWeight: deityInput === suggestion ? "700" : "500",
                    boxShadow: deityInput === suggestion
                      ? "0 0 15px rgba(0, 212, 255, 0.3)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.backgroundColor = deityInput === suggestion
                      ? "rgba(0, 212, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.boxShadow = deityInput === suggestion
                      ? "0 0 15px rgba(0, 212, 255, 0.3)"
                      : "none";
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
          fontStyle: "italic",
        }}>
          💡 Tip: You can enter any deity name, theme, or mythology story. The AI will help generate relevant content.
        </p>
      </div>

      {/* Song Title Input */}
      {deityInput && (
        <div className="glass-card accent-pink" style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          animation: "fadeIn var(--transition-base)",
        }}>
          <label style={{
            fontSize: "0.875rem",
            fontWeight: "700",
            color: "var(--accent-pink)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
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
              border: "1px solid rgba(255, 0, 110, 0.3)",
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 0, 110, 0.05)",
              color: "var(--text-primary)",
              transition: "all var(--transition-base)",
              fontFamily: "'Inter', sans-serif",
              backdropFilter: "blur(10px)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-pink)";
              e.currentTarget.style.background = "rgba(255, 0, 110, 0.1)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 0, 110, 0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 0, 110, 0.3)";
              e.currentTarget.style.background = "rgba(255, 0, 110, 0.05)";
              e.currentTarget.style.boxShadow = "none";
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
        className="btn-primary"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.25rem 2rem",
          borderRadius: "var(--radius-md)",
          fontSize: "1rem",
          fontWeight: "700",
          border: "none",
          cursor: deityInput ? "pointer" : "not-allowed",
          transition: "all var(--transition-base)",
          background: deityInput
            ? "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))"
            : "rgba(255, 255, 255, 0.1)",
          color: deityInput ? "#000" : "var(--text-muted)",
          boxShadow: deityInput ? "0 0 30px rgba(0, 212, 255, 0.4)" : "none",
          opacity: deityInput ? 1 : 0.5,
          width: "100%",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
        onMouseEnter={(e) => {
          if (deityInput) {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 0 50px rgba(0, 212, 255, 0.6)";
          }
        }}
        onMouseLeave={(e) => {
          if (deityInput) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 212, 255, 0.4)";
          }
        }}
      >
        Continue to Lyrics
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
