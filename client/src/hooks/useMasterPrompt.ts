import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useMasterPrompt() {
  const { project, setMasterPrompt } = useProject();
  const [showMasterPromptPanel, setShowMasterPromptPanel] = useState(false);
  const [masterPromptFeedback, setMasterPromptFeedback] = useState("");

  const generateMasterPromptMutation = trpc.generation.generateMasterPrompt.useMutation({
    onSuccess: (res) => {
      if (res.success && res.data?.masterPrompt) {
        setMasterPrompt(res.data.masterPrompt);
        setShowMasterPromptPanel(true);
        toast.success("Master Prompt generated!");
      } else {
        toast.error(res.error || "Failed to generate Master Prompt");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate Master Prompt");
    },
  });

  const refineMasterPromptMutation = trpc.generation.refineMasterPrompt.useMutation({
    onSuccess: (res) => {
      if (res.success && res.data?.masterPrompt) {
        setMasterPrompt(res.data.masterPrompt);
        setMasterPromptFeedback("");
        toast.success("Master Prompt refined!");
      } else {
        toast.error(res.error || "Failed to refine Master Prompt");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to refine Master Prompt");
    },
  });

  const generateMasterPrompt = (
    deity: string,
    lyrics: string,
    customDirection: string,
    category: string,
    mood?: string,
    llmModel?: string,
    languageStyle?: string,
    outputType?: string,
    duration?: number
  ) => {
    generateMasterPromptMutation.mutate({
      deity,
      lyrics,
      customDirection,
      category: category as any,
      mood,
      llmModel,
      languageStyle: languageStyle as any,
      outputType: outputType as any,
      duration,
    });
  };

  const refineMasterPrompt = (feedback: string, category: string, llmModel?: string, languageStyle?: string, outputType?: string, duration?: number) => {
    if (!project.masterPrompt) {
      toast.error("No Master Prompt to refine");
      return;
    }
    refineMasterPromptMutation.mutate({
      currentMasterPrompt: project.masterPrompt,
      feedback,
      category: category as any,
      llmModel,
    });
  };

  return {
    masterPrompt: project.masterPrompt,
    showMasterPromptPanel,
    setShowMasterPromptPanel,
    masterPromptFeedback,
    setMasterPromptFeedback,
    generateMasterPrompt,
    refineMasterPrompt,
    isGenerating: generateMasterPromptMutation.isPending,
    isRefining: refineMasterPromptMutation.isPending,
  };
}
