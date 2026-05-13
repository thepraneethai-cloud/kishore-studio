// ============================================================
// DESIGN: Story Selector for Story/Mythology Mode
// ============================================================
import { useState } from "react";
import { BookOpen, Scroll, Sparkles } from "lucide-react";

interface Story {
  id: string;
  title: string;
  description: string;
  category: "ramayana" | "mahabharata" | "mythology" | "custom";
  icon: React.ReactNode;
  chapters: number;
}

const PREDEFINED_STORIES: Story[] = [
  {
    id: "ramayana",
    title: "Ramayana",
    description: "The epic tale of Lord Rama's journey, exile, and triumph over evil",
    category: "ramayana",
    icon: <BookOpen className="w-8 h-8" />,
    chapters: 7,
  },
  {
    id: "mahabharata",
    title: "Mahabharata",
    description: "The great war between the Pandavas and Kauravas, filled with dharma and duty",
    category: "mahabharata",
    icon: <Scroll className="w-8 h-8" />,
    chapters: 18,
  },
  {
    id: "puranas",
    title: "Puranas & Mythology",
    description: "Stories of gods, goddesses, and divine incarnations from Hindu mythology",
    category: "mythology",
    icon: <Sparkles className="w-8 h-8" />,
    chapters: 12,
  },
];

interface StorySelectorProps {
  onSelect: (story: Story) => void;
  onCustomStory: () => void;
}

export default function StorySelector({ onSelect, onCustomStory }: StorySelectorProps) {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem",
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "1.875rem",
            fontWeight: "700",
            color: "#00d4ff",
            marginBottom: "0.5rem",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          📖 Choose Your Story
        </h2>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.95rem",
          }}
        >
          Select a classic story or create your own narrative
        </p>
      </div>

      {/* Story Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {PREDEFINED_STORIES.map((story) => (
          <button
            key={story.id}
            onClick={() => {
              setSelectedStory(story.id);
              onSelect(story);
            }}
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              border: selectedStory === story.id ? "2px solid #00d4ff" : "1px solid rgba(0, 212, 255, 0.2)",
              background: selectedStory === story.id 
                ? "rgba(0, 212, 255, 0.1)" 
                : "rgba(255, 255, 255, 0.02)",
              color: "white",
              cursor: "pointer",
              transition: "all 300ms ease",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              textAlign: "left",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              if (selectedStory !== story.id) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 212, 255, 0.5)";
                (e.currentTarget as HTMLElement).style.background = "rgba(0, 212, 255, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedStory !== story.id) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 212, 255, 0.2)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)";
              }
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  color: "#00d4ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {story.icon}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#00d4ff",
                  }}
                >
                  {story.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(0, 212, 255, 0.7)",
                    fontWeight: "500",
                  }}
                >
                  {story.chapters} chapters
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: "1.5",
              }}
            >
              {story.description}
            </p>
          </button>
        ))}

        {/* Custom Story Button */}
        <button
          onClick={onCustomStory}
          style={{
            padding: "1.5rem",
            borderRadius: "12px",
            border: "2px dashed rgba(0, 212, 255, 0.3)",
            background: "rgba(255, 255, 255, 0.02)",
            color: "rgba(0, 212, 255, 0.7)",
            cursor: "pointer",
            transition: "all 300ms ease",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            textAlign: "left",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 212, 255, 0.6)";
            (e.currentTarget as HTMLElement).style.color = "#00d4ff";
            (e.currentTarget as HTMLElement).style.background = "rgba(0, 212, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 212, 255, 0.3)";
            (e.currentTarget as HTMLElement).style.color = "rgba(0, 212, 255, 0.7)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)";
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
              }}
            >
              ✍️
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                }}
              >
                Create Custom Story
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.7,
                  fontWeight: "500",
                }}
              >
                Your own narrative
              </p>
            </div>
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
          >
            Upload or describe your own story and we'll generate scenes automatically
          </p>
        </button>
      </div>
    </div>
  );
}
