// ============================================================
// tRPC Routers for Image, Video, and Lyrics Generation
// ============================================================

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { generateDevotionalLyrics } from "../_core/lyricsGeneration";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { projects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  generateImageBatch,
  generateVideoBatch,
  pollGenerationJob,
} from "../_core/replicate";

export const generationRouter = router({
  // ============================================================
  // AUDIO UPLOAD
  // ============================================================
  uploadAudio: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        audioBuffer: z.union([z.instanceof(Buffer), z.instanceof(Uint8Array)]),
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Upload to S3
        const { url, key } = await storagePut(
          `projects/${input.projectId}/audio/${input.fileName}`,
          input.audioBuffer,
          input.mimeType
        );

        // Update project with audio URL
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        await db
          .update(projects)
          .set({
            audioUrl: url,
            audioStorageKey: key,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        return { success: true, url, key };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to upload audio",
        };
      }
    }),

  // ============================================================
  // LYRICS GENERATION
  // ============================================================
  generateLyrics: publicProcedure
    .input(
      z.object({
        deity: z.string(), // Accept any custom deity name (Hanuman, Shiva, custom mythology, etc.)
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
