// ============================================================
// DESIGN: "Digital Sanctum" — Main workspace page
// Fixed sidebar + scrollable main content area
// ============================================================
import { useProject } from "@/contexts/ProjectContext";
import Sidebar from "@/components/Sidebar";
import Step1Deity from "@/components/steps/Step1Deity";
import Step2Lyrics from "@/components/steps/Step2Lyrics";
import Step3SunoStyle from "@/components/steps/Step3SunoStyle";
import Step4MusicPrompt from "@/components/steps/Step4MusicPrompt";
import Step5Scenes from "@/components/steps/Step5Scenes";
import Step6ImagePrompts from "@/components/steps/Step6ImagePrompts";
import Step7VideoPrompts from "@/components/steps/Step7VideoPrompts";
import Step8CapCut from "@/components/steps/Step8CapCut";
import Step9YouTube from "@/components/steps/Step9YouTube";

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: Step1Deity,
  2: Step2Lyrics,
  3: Step3SunoStyle,
  4: Step4MusicPrompt,
  5: Step5Scenes,
  6: Step6ImagePrompts,
  7: Step7VideoPrompts,
  8: Step8CapCut,
  9: Step9YouTube,
};

export default function Home() {
  const { activeStep } = useProject();
  const StepComponent = STEP_COMPONENTS[activeStep] || Step1Deity;

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.14 0.018 55)" }}
    >
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main
        className="min-h-screen"
        style={{ marginLeft: "224px" }} /* 56 * 4 = 224px = w-56 */
      >
        {/* Top header bar */}
        <div
          className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between"
          style={{
            background: "oklch(0.14 0.018 55 / 0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid oklch(0.22 0.022 55)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-6 w-px"
              style={{ background: "oklch(0.72 0.12 75 / 0.4)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "oklch(0.72 0.12 75)", fontFamily: "'Cinzel', serif" }}
            >
              Telugu Devotional Video Studio
            </span>
          </div>
          <div
            className="text-xs px-2.5 py-1 rounded"
            style={{
              background: "oklch(0.72 0.12 75 / 0.1)",
              color: "oklch(0.65 0.14 65)",
              border: "1px solid oklch(0.72 0.12 75 / 0.2)",
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            Step {activeStep} of 9
          </div>
        </div>

        {/* Step workspace */}
        <div className="px-8 py-6 max-w-5xl">
          <StepComponent />
        </div>
      </main>
    </div>
  );
}
