// ============================================================
// DESIGN: Mobile Bottom Navigation for Step Switching
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEP_LABELS = [
  "Concept",
  "Audio",
  "Scenes",
  "Images",
  "Video",
  "CapCut",
  "YouTube",
];

export default function MobileBottomNav() {
  const { activeStep, setActiveStep } = useProject();

  const handlePrev = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  const handleNext = () => {
    if (activeStep < 7) setActiveStep(activeStep + 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        background: "rgba(10, 10, 20, 0.95)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        height: "60px",
      }}
    >
      {/* Previous button */}
      <button
        onClick={handlePrev}
        disabled={activeStep === 1}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          background: activeStep === 1 ? "rgba(0, 212, 255, 0.05)" : "rgba(0, 212, 255, 0.15)",
          color: activeStep === 1 ? "rgba(0, 212, 255, 0.3)" : "#00d4ff",
          cursor: activeStep === 1 ? "not-allowed" : "pointer",
          transition: "all 200ms ease",
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={18} />
      </button>

      {/* Step indicator */}
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: "0.75rem",
          fontWeight: "600",
          color: "#00d4ff",
          fontFamily: "'Space Grotesk', sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <div>{STEP_LABELS[activeStep - 1]}</div>
        <div style={{ fontSize: "0.65rem", color: "rgba(0, 212, 255, 0.6)" }}>
          Step {activeStep}/7
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={activeStep === 7}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          border: "1px solid rgba(0, 212, 255, 0.3)",
          background: activeStep === 7 ? "rgba(0, 212, 255, 0.05)" : "rgba(0, 212, 255, 0.15)",
          color: activeStep === 7 ? "rgba(0, 212, 255, 0.3)" : "#00d4ff",
          cursor: activeStep === 7 ? "not-allowed" : "pointer",
          transition: "all 200ms ease",
          flexShrink: 0,
        }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
