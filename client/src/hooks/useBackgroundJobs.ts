// ============================================================
// useBackgroundJobs Hook - Manage background generation tasks
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

export interface BackgroundJob {
  id: string;
  type: "lyrics" | "image" | "video" | "scene_generation";
  status: "queued" | "processing" | "succeeded" | "failed" | "cancelled";
  progress?: number;
  output?: any;
  errorMessage?: string;
}

export function useBackgroundJobs(projectId: number) {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createJobMutation = trpc.jobs.createJob.useMutation();
  const cancelJobMutation = trpc.jobs.cancelJob.useMutation();
  const retryJobMutation = trpc.jobs.retryJob.useMutation();

  // Create a new background job
  const createJob = useCallback(
    async (type: "lyrics" | "image" | "video" | "scene_generation", provider: string, input: Record<string, any>) => {
      try {
        const result = await createJobMutation.mutateAsync({
          projectId,
          type,
          provider,
          input,
        });

        const newJob: BackgroundJob = {
          id: result.jobId,
          type,
          status: "queued",
        };

        setJobs((prev) => [...prev, newJob]);
        return result.jobId;
      } catch (error) {
        console.error("Failed to create job:", error);
        throw error;
      }
    },
    [projectId, createJobMutation]
  );

  // Cancel a job
  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        await cancelJobMutation.mutateAsync({ jobId });
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "cancelled" } : j)));
      } catch (error) {
        console.error("Failed to cancel job:", error);
        throw error;
      }
    },
    [cancelJobMutation]
  );

  // Retry a failed job
  const retryJob = useCallback(
    async (jobId: string) => {
      try {
        await retryJobMutation.mutateAsync({ jobId });
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "queued" } : j)));
      } catch (error) {
        console.error("Failed to retry job:", error);
        throw error;
      }
    },
    [retryJobMutation]
  );

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling) return;
    setIsPolling(true);
  }, [isPolling]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    jobs,
    createJob,
    cancelJob,
    retryJob,
    isPolling,
    startPolling,
    stopPolling,
  };
}
