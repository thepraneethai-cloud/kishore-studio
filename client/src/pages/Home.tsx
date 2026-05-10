// ============================================================
// DESIGN: Main workspace with truly collapsible sidebar
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/_core/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Step2Lyrics from "@/components/steps/Step2Lyrics";
import Step3Audio from "@/components/steps/Step3Audio";

import Step5Scenes from "@/components/steps/Step5Scenes";
import Step6ImagePrompts from "@/components/steps/Step6ImagePrompts";
import Step7VideoPrompts from "@/components/steps/Step7VideoPrompts";
import Step8CapCut from "@/components/steps/Step8CapCut";
import Step9YouTube from "@/components/steps/Step9YouTube";
import { useIsMobile } from "@/hooks/useMobile";
import { useEffect, useState } from "react";

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: Step2Lyrics,
  2: Step3Audio,
  3: Step5Scenes,
  4: Step6ImagePrompts,
  5: Step7VideoPrompts,
  6: Step8CapCut,
  7: Step9YouTube,
};

export default function Home() {
  useAuth({ redirectOnUnauthenticated: true });
  const { activeStep } = useProject();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const StepComponent = STEP_COMPONENTS[activeStep] || Step2Lyrics;

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #16213e 100%)",
        backgroundAttachment: "fixed",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with toggle, title, and user menu */}
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} activeStep={activeStep} />

      {/* Main content area */}
      <div
        style={{
          display: "grid",
          // On mobile the sidebar floats as an overlay — don't reserve column space
          gridTemplateColumns: (!isMobile && sidebarOpen) ? "224px 1fr" : "1fr",
          flex: 1,
          transition: "grid-template-columns 250ms ease-out",
        }}
      >
        {/* Sidebar — rendered when open; on mobile it floats as a fixed drawer */}
        {sidebarOpen && (
          <>
            {/* Mobile: tap-away backdrop */}
            {isMobile && (
              <div
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.6)",
                  zIndex: 35,
                  backdropFilter: "blur(2px)",
                }}
              />
            )}
            <div
              style={{
                animation: "slideInLeft 250ms ease-out",
              }}
            >
              <Sidebar onClose={isMobile ? () => setSidebarOpen(false) : undefined} />
            </div>
          </>
        )}

        {/* Main workspace */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: isMobile ? "1rem" : "2rem",
              maxWidth: "1200px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <StepComponent />
          </div>
        </main>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
