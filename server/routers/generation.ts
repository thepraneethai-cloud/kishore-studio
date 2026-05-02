// ============================================================
// tRPC Routers for Image, Video, and Lyrics Generation
// ============================================================

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { generateDevotionalLyrics } from "../_core/lyricsGeneration";
import {
  generateImageBatch,
  generateVideoBatch,
  pollGenerationJob,
} from "../_core/replicate";

export const generationRouter = router({
  // ============================================================
  // LYRICS GENERATION
  // ============================================================
  generateLyrics: publicProcedure
    .input(
      z.object({
        deity: z.enum(["venkateswara", "ganesha", "lakshmi", "shiva"]),
        customPrompt: z.string().optional(),
        theme: z.string().optional(),
        duration: z.number().min(3).max(10).optional(),
        language: z.enum(["telugu", "english"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const lyrics = await generateDevotionalLyrics({
          deity: input.deity,
          customPrompt: input.customPrompt,
          theme: input.theme,
          duration: input.duration || 4,
          language: input.language || "telugu",
        });
        return { success: true, data: lyrics };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate lyrics",
        };
      }
    }),

  // ============================================================
  // IMAGE GENERATION (Batch)
  // ============================================================
  generateImages: publicProcedure
    .input(
      z.object({
        prompts: z.array(z.string()).min(1).max(50),
        replicateApiKey: z.string(),
        model: z.enum(["flux-pro", "flux-dev", "flux-schnell"]).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const jobs = await generateImageBatch(input.prompts, input.replicateApiKey, {
          model: (input.model as "flux-pro" | "flux-dev" | undefined) || "flux-pro",
          width: input.width,
          height: input.height,
        });
        return { success: true, data: jobs };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate images",
        };
      }
    }),

  // ============================================================
  // VIDEO GENERATION (Batch)
  // ============================================================
  generateVideos: publicProcedure
    .input(
      z.object({
        videos: z.array(
          z.object({
            imageUrl: z.string().url(),
            motionPrompt: z.string(),
            duration: z.number().min(5).max(30).optional(),
          })
        ),
        replicateApiKey: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const jobs = await generateVideoBatch(input.videos, input.replicateApiKey);
        return { success: true, data: jobs };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate videos",
        };
      }
    }),

  // ============================================================
  // POLL JOB STATUS
  // ============================================================
  pollJob: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        replicateApiKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const job = await pollGenerationJob(input.jobId, input.replicateApiKey);
        return { success: true, data: job };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to poll job",
        };
      }
    }),

  // ============================================================
  // POLL MULTIPLE JOBS
  // ============================================================
  pollJobs: publicProcedure
    .input(
      z.object({
        jobIds: z.array(z.string()),
        replicateApiKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const jobs = await Promise.all(
          input.jobIds.map((jobId) => pollGenerationJob(jobId, input.replicateApiKey))
        );
        return { success: true, data: jobs };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to poll jobs",
        };
      }
    }),
});
