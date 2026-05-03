// ============================================================
// DESIGN: Main workspace with truly collapsible sidebar
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Step1Deity from "@/components/steps/Step1Deity";
import Step2Lyrics from "@/components/steps/Step2Lyrics";
import Step3Audio from "@/components/steps/Step3Audio";
import Step4MusicPrompt from "@/components/steps/Step4MusicPrompt";
import Step5Scenes from "@/components/steps/Step5Scenes";
import Step6ImagePrompts from "@/components/steps/Step6ImagePrompts";
import Step7VideoPrompts from "@/components/steps/Step7VideoPrompts";
import Step8CapCut from "@/components/steps/Step8CapCut";
import Step9YouTube from "@/components/steps/Step9YouTube";
import { useState } from "react";

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: Step1Deity,
  2: Step2Lyrics,
  3: Step3Audio,
  4: Step4MusicPrompt,
  5: Step5Scenes,
  6: Step6ImagePrompts,
  7: Step7VideoPrompts,
  8: Step8CapCut,
  9: Step9YouTube,
};

export default function Home() {
  const { activeStep } = useProject();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const StepComponent = STEP_COMPONENTS[activeStep] || Step1Deity;

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
      <div style={{ display: "grid", gridTemplateColumns: sidebarOpen ? "280px 1fr" : "1fr", flex: 1, transition: "grid-template-columns 250ms ease-out" }}>
        {/* Sidebar - Conditionally rendered */}
        {sidebarOpen && (
          <div
            style={{
              animation: "slideInLeft 250ms ease-out",
            }}
          >
            <Sidebar />
          </div>
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
              padding: "2rem",
              maxWidth: "1200px",
              margin: "0 auto",
              width: "100%",
            }}
            onClick={() => setSidebarOpen(false)}
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
