// ============================================================
// tRPC Routers for Image, Video, and Lyrics Generation
// ============================================================

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { assertBudgetAvailable } from "../_core/budgetCheck";
import { generateDevotionalLyrics } from "../_core/lyricsGeneration";
import { storagePut } from "../storage";
import { getDb, getUserSettings } from "../db";
import { projects, costTracking } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  generateImageBatch,
  generateVideoBatch,
  pollGenerationJob,
} from "../_core/replicate";
import { analyzeSceneArc } from "../_core/sceneDirector";
import { generateImagesWithOpenAI } from "../_core/openaiImages";
import { invokeLLM } from "../_core/llm";

// Per-unit cost estimates in USD
const UNIT_COSTS = {
  lyrics:       0.0001, // gemini-2.5-flash is extremely cheap
  image:        0.0100, // flux-dev ~$0.01/image
  image_dalle3: 0.0400, // dall-e-3 standard ~$0.04/image, hd ~$0.08
  image_gpt:    0.0167, // gpt-image-1 medium ~$0.0167/image
  video:        0.0500, // minimax video-01 ~$0.05/clip
};

async function recordCost(
  userId: number,
  type: "lyrics" | "image" | "video",
  provider: string,
  unitCost: number,
  count = 1,
  jobId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return; // best-effort — never block generation on cost logging
  try {
    const rows = Array.from({ length: count }, () => ({
      userId,
      type,
      provider,
      cost: unitCost.toFixed(4),
      jobId: jobId || null,
      date: new Date(),
    }));
    await db.insert(costTracking).values(rows);
  } catch (err) {
    console.error("[CostTracking] Failed to log cost:", err);
  }
}

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
  generateLyrics: protectedProcedure
    .input(
      z.object({
        deity: z.string(), // Accept any custom deity name (Hanuman, Shiva, custom mythology, etc.)
        customPrompt: z.string().optional(),   // iterate feedback / manual direction (appendix)
        directivePrompt: z.string().optional(), // AI-generated vision brief (primary user message)
        theme: z.string().optional(),
        duration: z.number().min(1).max(10).optional(),
        language: z.enum(["telugu", "english"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const lyrics = await generateDevotionalLyrics({
          deity: input.deity,
          customPrompt: input.customPrompt,
          directivePrompt: input.directivePrompt,
          theme: input.theme,
          duration: input.duration || 4,
          language: input.language || "telugu",
          llmApiKey: userSettings?.geminiApiKey || undefined,
        });
        // Record cost after success (non-blocking)
        void recordCost(ctx.user.id, "lyrics", "gemini", UNIT_COSTS.lyrics);
        return { success: true, data: lyrics };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate lyrics",
        };
      }
    }),

  // ============================================================
  // LYRICS PROMPT GENERATOR — AI crafts a detailed directive
  // ============================================================
  generateLyricsPrompt: protectedProcedure
    .input(
      z.object({
        deity: z.string(),
        userIdea: z.string().min(3).max(600),
        theme: z.string().optional(),
        language: z.enum(["telugu", "english"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const lang = input.language ?? "telugu";

        const result = await invokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  "You are an expert Telugu devotional music consultant specialising in Carnatic classical compositions, bhajans, and stotrams for South Indian YouTube audiences. " +
                  "Your task: take a user's rough idea and expand it into a precise, structured creative directive (150–200 words) that an AI lyrics generator can follow exactly. " +
                  "Cover: emotional journey, specific imagery, song structure (Pallavi then Charanam lines), key Sanskrit/Telugu words or epithets to weave in, and the devotional mood. " +
                  "Return ONLY the directive — no explanations, no headings, no markdown.",
              },
              {
                role: "user",
                content: `Deity / theme: ${input.deity}\nMy idea: ${input.userIdea}\nTheme: ${input.theme ?? "devotion"}\nLanguage: ${lang}\n\nWrite the directive now.`,
              },
            ],
            maxTokens: 400,
          },
          userSettings?.geminiApiKey ? { apiKey: userSettings.geminiApiKey } : undefined
        );

        const prompt = (result.choices[0]?.message?.content ?? "").toString().trim();
        if (!prompt) throw new Error("AI returned an empty prompt");

        void recordCost(ctx.user.id, "lyrics", "gemini", UNIT_COSTS.lyrics);
        return { success: true, data: { prompt } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate prompt",
        };
      }
    }),

  // ============================================================
  // DIRECTOR ANALYSIS — emotional arc + shot vocabulary
  // ============================================================
  directorAnalysis: protectedProcedure
    .input(
      z.object({
        deity: z.string(),
        scenes: z.array(
          z.object({
            sceneId: z.number(),
            lyricLine: z.string(),
            sceneDescription: z.string(),
          })
        ).min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const result = await analyzeSceneArc(
          input.deity,
          input.scenes,
          userSettings?.geminiApiKey || undefined
        );
        void recordCost(ctx.user.id, "lyrics", "gemini", UNIT_COSTS.lyrics * 3); // director analysis is ~3x a lyrics call
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Director analysis failed",
        };
      }
    }),

  // ============================================================
  // IMAGE GENERATION (Batch)
  // ============================================================
  generateImages: protectedProcedure
    .input(
      z.object({
        prompts: z.array(z.string()).min(1).max(50),
        // Replicate (Flux) options
        replicateApiKey: z.string().optional(),
        model: z.enum(["flux-pro", "flux-dev", "flux-schnell"]).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        stylePrefix: z.string().optional(),
        seed: z.number().optional(),
        // OpenAI (DALL-E) options
        provider: z.enum(["flux", "dalle"]).optional(),
        openaiApiKey: z.string().optional(),
        dalleModel: z.enum(["dall-e-3", "gpt-image-1"]).optional(),
        dalleQuality: z.enum(["standard", "hd"]).optional(),
        dalleStyle: z.enum(["natural", "vivid"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);

        // Prepend character style prefix to every prompt if provided
        const resolvedPrompts = input.stylePrefix
          ? input.prompts.map((p) => `${input.stylePrefix} | ${p}`)
          : input.prompts;

        // ── OpenAI / DALL-E path ──────────────────────────────
        if (input.provider === "dalle") {
          const apiKey = input.openaiApiKey;
          if (!apiKey) throw new Error("OpenAI API key is required for DALL-E generation");

          const dalleModel = input.dalleModel ?? "dall-e-3";
          const openAIJobs = await generateImagesWithOpenAI(resolvedPrompts, apiKey, {
            model: dalleModel,
            quality: input.dalleQuality ?? "standard",
            style: input.dalleStyle ?? "natural",
          });

          // Normalise to the same shape the client expects from Replicate
          const jobs = openAIJobs.map((j) => ({
            id: j.id,
            status: j.status,
            output: j.output,
            error: j.error,
            createdAt: j.createdAt,
            completedAt: j.createdAt,
          }));

          const unitCost = dalleModel === "gpt-image-1" ? UNIT_COSTS.image_gpt : UNIT_COSTS.image_dalle3;
          void recordCost(ctx.user.id, "image", dalleModel, unitCost, input.prompts.length);
          return { success: true, data: jobs };
        }

        // ── Replicate / Flux path (default) ──────────────────
        if (!input.replicateApiKey) throw new Error("Replicate API key is required for Flux generation");

        const jobs = await generateImageBatch(resolvedPrompts, input.replicateApiKey, {
          model: (input.model as "flux-pro" | "flux-dev" | "flux-schnell" | undefined) || "flux-dev",
          width: input.width,
          height: input.height,
          seed: input.seed,
        });
        void recordCost(ctx.user.id, "image", "flux", UNIT_COSTS.image, input.prompts.length);
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
  generateVideos: protectedProcedure
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
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const jobs = await generateVideoBatch(input.videos, input.replicateApiKey);
        void recordCost(ctx.user.id, "video", "minimax", UNIT_COSTS.video, input.videos.length);
        return { success: true, data: jobs };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate videos",
        };
      }
    }),

  // ============================================================
  // REFINE SUNO STYLE BASED ON FEEDBACK
  // ============================================================
  refineSunoStyle: protectedProcedure
    .input(
      z.object({
        lyrics: z.string(),
        currentStyle: z.record(z.string(), z.any()).optional(),
        feedback: z.string(),
        theme: z.string().optional(),
        deity: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const result = await generateDevotionalLyrics({
          deity: input.deity || "General",
          customPrompt: `Based on these lyrics and feedback, generate a refined SUNO music style. Lyrics: ${input.lyrics.substring(0, 200)}. User feedback: ${input.feedback}`,
          theme: input.theme,
          duration: 4,
          language: "telugu",
        });
        return { success: true, data: result.sunoStyle || {} };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to refine SUNO style",
        };
      }
    }),

  // ============================================================
  // POLL JOB STATUS
  // ============================================================
  pollJob: protectedProcedure
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
  pollJobs: protectedProcedure
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
