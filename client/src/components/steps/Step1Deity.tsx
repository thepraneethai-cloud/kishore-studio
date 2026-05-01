// ============================================================
// DESIGN: "Digital Sanctum" — Step 1: Deity / Theme Selector
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { DEITIES, Deity } from "@/lib/studioData";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight } from "lucide-react";

const DEITY_IMAGES: Record<string, string> = {
  venkateswara: "https://d2xsxph8kpxj0f.cloudfront.net/310519663619352162/mbLFL8pGLWGQKSC3y2Mcrs/deity-collage-UDb27ueXCqyauKtA4gaDVu.webp",
  ganesha: "https://d2xsxph8kpxj0f.cloudfront.net/310519663619352162/mbLFL8pGLWGQKSC3y2Mcrs/deity-collage-UDb27ueXCqyauKtA4gaDVu.webp",
  lakshmi: "https://d2xsxph8kpxj0f.cloudfront.net/310519663619352162/mbLFL8pGLWGQKSC3y2Mcrs/deity-collage-UDb27ueXCqyauKtA4gaDVu.webp",
  shiva: "https://d2xsxph8kpxj0f.cloudfront.net/310519663619352162/mbLFL8pGLWGQKSC3y2Mcrs/deity-collage-UDb27ueXCqyauKtA4gaDVu.webp",
};

// Quadrant positions in the 2x2 deity collage image (as CSS object-position)
const DEITY_POSITIONS: Record<string, string> = {
  venkateswara: "0% 0%",
  ganesha: "100% 0%",
  lakshmi: "0% 100%",
  shiva: "100% 100%",
};

export default function Step1Deity() {
  const { project, setDeity, setTitle, setActiveStep, markStepComplete } = useProject();

  const handleSelect = (deity: Deity) => {
    setDeity(deity.key);
    if (!project.title) {
      setTitle(`${deity.name} Devotional Song`);
    }
  };

  const handleContinue = () => {
    if (project.deity) {
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
          Choose your deity — this defines the visuals, mood, instruments, and audience for your entire video.
        </p>
      </div>

      {/* Deity Cards */}
      <div className="grid grid-cols-2 gap-4">
        {DEITIES.map((deity) => {
          const isSelected = project.deity === deity.key;
          return (
            <button
              key={deity.key}
              onClick={() => handleSelect(deity)}
              className={cn(
                "relative rounded-lg overflow-hidden text-left transition-all duration-200 group",
                "hover:scale-[1.02]"
              )}
              style={{
                border: isSelected
                  ? `2px solid ${deity.color}`
                  : "2px solid oklch(0.28 0.025 58)",
                boxShadow: isSelected
                  ? `0 0 20px ${deity.color}40, 0 4px 24px oklch(0 0 0 / 0.5)`
                  : "0 4px 16px oklch(0 0 0 / 0.4)",
              }}
            >
              {/* Deity image quadrant */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={DEITY_IMAGES[deity.key]}
                  alt={deity.name}
                  className="absolute object-cover"
                  style={{
                    width: "200%",
                    height: "200%",
                    top: (deity.key === "venkateswara" || deity.key === "ganesha") ? "0" : "-100%",
                    left: (deity.key === "venkateswara" || deity.key === "lakshmi") ? "0" : "-100%",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isSelected
                      ? `linear-gradient(to bottom, transparent 30%, ${deity.color}80 100%)`
                      : "linear-gradient(to bottom, transparent 30%, oklch(0.14 0.018 55 / 0.9) 100%)",
                  }}
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={20} style={{ color: deity.color }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3" style={{ background: "oklch(0.18 0.016 52)" }}>
                <p
                  className="font-bold text-sm mb-0.5"
                  style={{ fontFamily: "'Cinzel', serif", color: isSelected ? deity.color : "oklch(0.85 0.018 75)" }}
                >
                  {deity.name}
                </p>
                <p
                  className="text-xs mb-2"
                  style={{ fontFamily: "'Noto Sans Telugu', sans-serif", color: "oklch(0.65 0.14 65)" }}
                >
                  {deity.teluguName}
                </p>
                <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                  {deity.mood}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {deity.instruments.slice(0, 3).map((inst) => (
                    <span
                      key={inst}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "oklch(0.22 0.018 52)",
                        color: "oklch(0.60 0.015 68)",
                      }}
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Song Title Input */}
      {project.deity && (
        <div className="shrine-panel p-4 space-y-3">
          <label className="text-sm font-semibold" style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}>
            Song Title
          </label>
          <input
            type="text"
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Govinda Govinda — Venkateswara Bhajan"
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
        disabled={!project.deity}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200",
          project.deity
            ? "hover:opacity-90 hover:scale-[1.02]"
            : "opacity-40 cursor-not-allowed"
        )}
        style={{
          background: project.deity
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
