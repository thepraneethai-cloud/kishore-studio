import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MasterPromptPanelProps {
  masterPrompt: string;
  isOpen: boolean;
  onToggle: () => void;
  onRefine: (feedback: string) => void;
  isRefining: boolean;
}

export function MasterPromptPanel({
  masterPrompt,
  isOpen,
  onToggle,
  onRefine,
  isRefining,
}: MasterPromptPanelProps) {
  const [feedback, setFeedback] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(masterPrompt);
    toast.success("Master Prompt copied to clipboard!");
  };

  const handleRefine = () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }
    onRefine(feedback);
  };

  if (!masterPrompt) return null;

  return (
    <div className="border border-purple-400/30 rounded-lg bg-gradient-to-br from-purple-950/40 to-pink-950/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-purple-300">Master Prompt</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-purple-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-400" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-purple-400/20 p-4 space-y-3">
          {/* Master Prompt Display */}
          <div className="bg-black/30 rounded p-3 max-h-48 overflow-y-auto">
            <p className="text-sm text-purple-200 leading-relaxed whitespace-pre-wrap">
              {masterPrompt}
            </p>
          </div>

          {/* Copy Button */}
          <Button
            onClick={handleCopy}
            size="sm"
            variant="outline"
            className="w-full gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Master Prompt
          </Button>

          {/* Refinement Section */}
          <div className="space-y-2 pt-2 border-t border-purple-400/20">
            <label className="text-xs font-semibold text-purple-300">
              Refine with Feedback
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="E.g., 'Make it more energetic', 'Add more traditional elements', etc."
              className="text-sm resize-none h-20"
              disabled={isRefining}
            />
            <Button
              onClick={handleRefine}
              size="sm"
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              disabled={isRefining || !feedback.trim()}
            >
              <RefreshCw className={`w-4 h-4 ${isRefining ? "animate-spin" : ""}`} />
              {isRefining ? "Refining..." : "Refine Master Prompt"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
