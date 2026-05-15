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
import { generateImagesWithPollinations, generateImagesWithTogether, generateImagesWithFal } from "../_core/providers/images";
import { submitFalVideoJob, pollFalVideoJob, FalVideoModel } from "../_core/providers/fal";
import { invokeLLM } from "../_core/llm";
import { isR2Configured, uploadToR2 } from "../_core/r2Storage";
import { ENV } from "../_core/env";

// Resolve an API key: Railway env var takes priority, then user-supplied value.
// This means keys set in Railway Variables are always used even if the DB is empty.
function resolveKey(envKey: string, userSupplied?: string | null): string {
  return (envKey && envKey.length > 0) ? envKey : (userSupplied ?? "");
}

// Build invokeLLM options — always merges Railway env vars with user DB keys.
// Railway wins. User DB key is fallback. Never rely on DB alone.
function buildLlmOptions(userSettings: { geminiApiKey?: string | null; openaiApiKey?: string | null; claudeApiKey?: string | null; groqApiKey?: string | null; mistralApiKey?: string | null; llmModel?: string | null } | null | undefined, modelOverride?: string | null) {
  const geminiKey  = resolveKey(ENV.geminiApiKey,  userSettings?.geminiApiKey);
  const openaiKey  = resolveKey(ENV.openaiApiKey,  userSettings?.openaiApiKey);
  const claudeKey  = resolveKey(ENV.claudeApiKey,  userSettings?.claudeApiKey);
  const groqKey    = resolveKey(ENV.groqApiKey,    userSettings?.groqApiKey);
  const mistralKey = resolveKey(ENV.mistralApiKey, userSettings?.mistralApiKey);
  return {
    model:         modelOverride || userSettings?.llmModel || undefined,
    ...(geminiKey  ? { apiKey:        geminiKey  } : {}),
    ...(openaiKey  ? { openaiApiKey:  openaiKey  } : {}),
    ...(claudeKey  ? { claudeApiKey:  claudeKey  } : {}),
    ...(groqKey    ? { groqApiKey:    groqKey    } : {}),
    ...(mistralKey ? { mistralApiKey: mistralKey } : {}),
  };
}

// Per-unit cost estimates in USD
const UNIT_COSTS = {
  lyrics:           0.0001,
  image:            0.0100, // flux-dev via Replicate ~$0.01
  image_dalle3:     0.0400, // dall-e-3 standard ~$0.04, hd ~$0.08
  image_gpt:        0.0167, // gpt-image-1 ~$0.0167
  image_pollinations: 0.0000, // free
  image_together:   0.0000, // free tier (FLUX.1-schnell-Free)
  image_fal:        0.0030, // fal.ai flux-schnell ~$0.003
  video:            0.0500, // minimax via Replicate ~$0.05
  video_fal_wan:    0.0250, // fal.ai Wan2.1 ~$0.025
  video_fal_kling:  0.0300, // fal.ai Kling ~$0.03
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
        const storageKey = `projects/${input.projectId}/audio/${Date.now()}-${input.fileName}`;
        let url: string;
        let key: string;

        if (isR2Configured()) {
          key = storageKey;
          url = await uploadToR2(storageKey, Buffer.from(input.audioBuffer), input.mimeType);
        } else {
          const uploaded = await storagePut(storageKey, input.audioBuffer, input.mimeType);
          url = uploaded.url;
          key = uploaded.key;
        }

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
        deity: z.string(),
        category: z.enum(["devotional", "cinematic", "folk", "romantic", "emotional", "festival", "mass"]).optional(),
        mood: z.string().optional(),
        languageStyle: z.enum(["pure_telugu", "colloquial", "poetic", "mixed"]).optional(),
        outputType: z.enum(["lyrics_only", "lyrics_suno", "lyrics_scene"]).optional(),
        customPrompt: z.string().optional(),
        directivePrompt: z.string().optional(),
        masterPrompt: z.string().optional(),
        theme: z.string().optional(),
        duration: z.number().min(1).max(10).optional(),
        language: z.enum(["telugu", "english"]).optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const lyrics = await generateDevotionalLyrics({
          deity: input.deity,
          category: input.category,
          mood: input.mood,
          languageStyle: input.languageStyle,
          outputType: input.outputType,
          customPrompt: input.customPrompt,
          directivePrompt: input.directivePrompt,
          masterPrompt: input.masterPrompt,
          theme: input.theme,
          duration: input.duration || 4,
          language: input.language || "telugu",
          llmApiKey: resolveKey(ENV.geminiApiKey, userSettings?.geminiApiKey) || undefined,
          llmModel: input.llmModel || userSettings?.llmModel || undefined,
          openaiApiKey: resolveKey(ENV.openaiApiKey, userSettings?.openaiApiKey) || undefined,
          claudeApiKey: resolveKey(ENV.claudeApiKey, userSettings?.claudeApiKey) || undefined,
          groqApiKey: resolveKey(ENV.groqApiKey, userSettings?.groqApiKey) || undefined,
          mistralApiKey: resolveKey(ENV.mistralApiKey, userSettings?.mistralApiKey) || undefined,
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
        category: z.enum(["devotional", "cinematic", "folk", "romantic", "emotional", "festival", "mass"]).optional(),
        mood: z.string().optional(),
        theme: z.string().optional(),
        language: z.enum(["telugu", "english"]).optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const lang = input.language ?? "telugu";
        const category = input.category ?? "devotional";

        const categoryConsultant: Record<string, string> = {
          devotional: "Telugu devotional music consultant specialising in bhajans, keertanas, and stotrams",
          cinematic:  "Telugu film lyricist consultant (in the style of Sirivennela, Chandrabose, Ananta Sriram)",
          folk:       "Telugu folk (Janapada) song consultant with deep knowledge of rural Andhra traditions",
          romantic:   "Telugu romantic melody lyricist consultant",
          emotional:  "Telugu emotional ballad lyricist consultant",
          festival:   "Telugu festival and celebration song lyricist consultant",
          mass:       "Telugu mass entertainer lyricist consultant (commercial hero anthem style)",
        };

        const result = await invokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  `You are an expert ${categoryConsultant[category] ?? categoryConsultant.devotional} for South Indian YouTube audiences. ` +
                  "Your task: take a user's rough idea and expand it into a precise, structured creative directive (150–200 words) that an AI lyrics generator can follow exactly. " +
                  "STRICT RULES: " +
                  "(1) Stay 100% faithful to the subject and idea the user gave — do NOT invent themes, characters, or narratives they did not mention. " +
                  "(2) If the user's idea is short (e.g. 'Jai Sriram'), treat it as the emotional core and expand the setting, imagery, and mood around THAT subject — never pivot to an unrelated theme. " +
                  "(3) Do NOT introduce mother/family themes unless the user explicitly asked for them. " +
                  "Cover: emotional journey, specific imagery, song structure (Pallavi then Charanam lines), key Telugu words, cultural references tied to the stated subject, and the target mood. " +
                  "Return ONLY the directive — no explanations, no headings, no markdown.",
              },
              {
                role: "user",
                content: `Subject: ${input.deity}\nCategory: ${category}\nMood: ${input.mood || "meditative and devotional"}\nUser's idea: "${input.userIdea}"\nLanguage: ${lang}\n\nWrite a directive for a song strictly about the stated subject and idea. Do not introduce unrelated themes.`,
              },
            ],
            maxTokens: 400,
          },
          buildLlmOptions(userSettings, input.llmModel || userSettings?.llmModel || undefined)
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
  // SCENE BREAKDOWN — AI-generated scene descriptions + image prompts
  // ============================================================
  generateSceneBreakdown: protectedProcedure
    .input(z.object({
      lyrics:   z.string(),
      deity:    z.string().optional(),
      category: z.string().optional(),
      mood:     z.string().optional(),
      llmModel: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);

        const lines = input.lyrics
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("[") && l.length > 3)
          .slice(0, 32);

        if (lines.length === 0) throw new Error("No lyric lines found in the lyrics");

        const deity   = input.deity    || "Hindu deity";
        const category = input.category || "sacred";
        const mood    = input.mood     || "meditative and serene";

        const systemPrompt =
          `You are a professional visual director creating scene breakdowns for a South Indian music video about ${deity}. ` +
          `Your job: for each lyric line, create a unique cinematic visual scene and a detailed AI image-generator prompt.`;

        const userPrompt =
          `Song honoring ${deity} — style: ${category}, mood: ${mood}.\n\n` +
          `For EACH lyric line below, produce:\n` +
          `- sceneDescription: 1 vivid sentence describing exactly what the camera sees (specific objects, setting, action — NO generic labels)\n` +
          `- imagePrompt: 2-sentence detailed AI image prompt. Lead with the specific visual subject (deity, ritual object, architectural detail, nature element). ` +
          `End every prompt with: "South Indian temple art style, warm oil lamp lighting, incense atmosphere, 8K quality, no text, no humans"\n\n` +
          `Rules:\n` +
          `• Every scene MUST be visually distinct — no repeated descriptions\n` +
          `• Each scene must reflect the meaning of THAT specific lyric line — vary: deity close-ups, ritual objects, temple architecture, nature, abstract light\n` +
          `• Do NOT start any imagePrompt with generic words like "Devotional", "Sacred", "Scene" — lead with the concrete visual subject\n` +
          `• Vary shot types: extreme close-up, wide establishing shot, medium, aerial, macro detail\n\n` +
          `Lyric lines:\n` +
          lines.map((line, i) => `${i + 1}. ${line}`).join("\n") +
          `\n\nReturn ONLY a valid JSON array, no markdown fences:\n` +
          `[{"id":1,"lyricLine":"...","sceneDescription":"...","imagePrompt":"..."}]`;

        const result = await invokeLLM(
          {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: userPrompt   },
            ],
            maxTokens: 8192,
          },
          buildLlmOptions(userSettings, input.llmModel || userSettings?.llmModel || undefined)
        );

        const raw = (result.choices[0]?.message?.content ?? "").toString().trim();

        // Parse JSON — handle both bare arrays and objects wrapping the array
        let aiScenes: Array<{ id: number; lyricLine: string; sceneDescription: string; imagePrompt: string }> = [];
        try {
          const parsed = JSON.parse(raw);
          aiScenes = Array.isArray(parsed) ? parsed : (parsed.scenes ?? parsed.data ?? []);
        } catch {
          const match = raw.match(/\[[\s\S]*\]/);
          if (match) {
            try { aiScenes = JSON.parse(match[0]); } catch { /* fall through to fallback */ }
          }
        }

        // Merge AI output with line list; fill any gaps with a reasonable fallback
        const scenes = lines.map((line, i) => {
          const ai = aiScenes.find((s) => s.id === i + 1) ?? aiScenes[i];
          return {
            id:               i + 1,
            lyricLine:        line,
            sceneDescription: ai?.sceneDescription || `${deity} temple scene: ${line.substring(0, 80)}`,
            imagePrompt:      ai?.imagePrompt       || `${deity} in ornate South Indian temple, stone carvings and oil lamp glow, scene inspired by: "${line.substring(0, 60)}". Warm amber lighting, incense smoke, 8K quality, no text, no humans`,
            motionPrompt:     `Gentle slow camera push-in (0.3x zoom over 6 seconds). Soft particle glow on light sources, subtle smoke drift, lamp flames flickering.`,
            duration:         5,
          };
        });

        void recordCost(ctx.user.id, "lyrics", "gemini", UNIT_COSTS.lyrics * 2);
        return { success: true, data: { scenes } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Scene breakdown generation failed",
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
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const llmOpts = buildLlmOptions(userSettings, input.llmModel || userSettings?.llmModel || undefined);
        const result = await analyzeSceneArc(
          input.deity,
          input.scenes,
          llmOpts.apiKey,
          llmOpts.model,
          llmOpts.openaiApiKey,
          llmOpts.claudeApiKey,
          llmOpts.groqApiKey,
          llmOpts.mistralApiKey,
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
        model: z.enum(["flux-pro", "flux-dev", "flux-schnell", "seedream-4.5"]).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        stylePrefix: z.string().optional(),
        seed: z.number().optional(),
        // OpenAI (DALL-E) options
        provider: z.enum(["flux", "dalle", "pollinations", "together", "fal"]).optional(),
        openaiApiKey: z.string().optional(),
        dalleModel: z.enum(["dall-e-3", "gpt-image-1"]).optional(),
        dalleQuality: z.enum(["standard", "hd"]).optional(),
        dalleStyle: z.enum(["natural", "vivid"]).optional(),
        // Free / fal.ai options
        togetherApiKey: z.string().optional(),
        falApiKey: z.string().optional(),
        falModel: z.enum(["flux-schnell", "flux-dev"]).optional(),
        pollinationsModel: z.enum(["flux", "flux-realism", "turbo"]).optional(),
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
          const apiKey = resolveKey(ENV.openaiApiKey, input.openaiApiKey);
          if (!apiKey) throw new Error("OpenAI API key is required for DALL-E generation. Set OPENAI_API_KEY in Railway Variables or enter it in Settings.");

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

        // ── Pollinations path (free, no key) ─────────────────
        if (input.provider === "pollinations") {
          const urls = generateImagesWithPollinations(resolvedPrompts, input.pollinationsModel ?? "flux");
          const jobs = urls.map((url, i) => ({
            id: `pollinations-${Date.now()}-${i}`,
            status: "succeeded" as const,
            output: url,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }));
          void recordCost(ctx.user.id, "image", "pollinations", UNIT_COSTS.image_pollinations, input.prompts.length);
          return { success: true, data: jobs };
        }

        // ── Together AI path (free tier) ──────────────────────
        if (input.provider === "together") {
          const togetherKey = resolveKey(ENV.togetherApiKey, input.togetherApiKey);
          if (!togetherKey) throw new Error("Together AI API key is required. Sign up free at api.together.ai or set TOGETHER_API_KEY in Railway Variables.");
          const urls = await generateImagesWithTogether(resolvedPrompts, togetherKey);
          const jobs = urls.map((url, i) => ({
            id: `together-${Date.now()}-${i}`,
            status: "succeeded" as const,
            output: url,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }));
          void recordCost(ctx.user.id, "image", "together", UNIT_COSTS.image_together, input.prompts.length);
          return { success: true, data: jobs };
        }

        // ── fal.ai image path ─────────────────────────────────
        if (input.provider === "fal") {
          const falKey = resolveKey(ENV.falApiKey, input.falApiKey);
          if (!falKey) throw new Error("fal.ai API key is required. Sign up free at fal.ai or set FAL_API_KEY in Railway Variables.");
          const urls = await generateImagesWithFal(resolvedPrompts, falKey, input.falModel ?? "flux-schnell");
          const jobs = urls.map((url, i) => ({
            id: `fal-${Date.now()}-${i}`,
            status: "succeeded" as const,
            output: url,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }));
          void recordCost(ctx.user.id, "image", "fal", UNIT_COSTS.image_fal, input.prompts.length);
          return { success: true, data: jobs };
        }

        // ── Replicate / Flux path (default) ──────────────────
        const replicateKey = resolveKey(ENV.replicateApiKey, input.replicateApiKey);
        if (!replicateKey) throw new Error("Replicate API key is required. Set REPLICATE_API_KEY in Railway Variables or enter it in Settings.");

        const jobs = await generateImageBatch(resolvedPrompts, replicateKey, {
          model: (input.model as "flux-pro" | "flux-dev" | "flux-schnell" | "seedream-4.5" | undefined) || "flux-dev",
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
        replicateApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const replicateKey = resolveKey(ENV.replicateApiKey, input.replicateApiKey);
        if (!replicateKey) throw new Error("Replicate API key is required. Set REPLICATE_API_KEY in Railway Variables or enter it in Settings.");
        const jobs = await generateVideoBatch(input.videos, replicateKey);
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
  // VIDEO GENERATION via fal.ai (Wan2.1 / Kling) — free credits
  // ============================================================
  generateVideosFal: protectedProcedure
    .input(
      z.object({
        videos: z.array(
          z.object({
            imageUrl: z.string().url(),
            motionPrompt: z.string(),
            sceneId: z.number(),
          })
        ),
        falApiKey: z.string().optional(),
        model: z.enum(["wan", "kling"]).default("wan"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const falKey = resolveKey(ENV.falApiKey, input.falApiKey);
        if (!falKey) throw new Error("fal.ai API key is required. Set FAL_API_KEY in Railway Variables or enter it in Settings.");
        const jobs = await Promise.all(
          input.videos.map((v) =>
            submitFalVideoJob(v.imageUrl, v.motionPrompt, v.sceneId, falKey, input.model as FalVideoModel)
          )
        );
        const costKey = input.model === "kling" ? "video_fal_kling" : "video_fal_wan";
        void recordCost(ctx.user.id, "video", `fal-${input.model}`, UNIT_COSTS[costKey], input.videos.length);
        return { success: true, data: jobs };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to start fal.ai video jobs" };
      }
    }),

  // ── Poll fal.ai video jobs ─────────────────────────────────
  pollFalJobs: protectedProcedure
    .input(
      z.object({
        jobs: z.array(z.object({ requestId: z.string(), model: z.enum(["wan", "kling"]), sceneId: z.number() })),
        falApiKey: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const falKey = resolveKey(ENV.falApiKey, input.falApiKey);
        const results = await Promise.all(
          input.jobs.map((j) => pollFalVideoJob(j.requestId, j.model as FalVideoModel, j.sceneId, falKey))
        );
        return { success: true, data: results };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to poll fal.ai jobs" };
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
        replicateApiKey: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const replicateKey = resolveKey(ENV.replicateApiKey, input.replicateApiKey);
        const job = await pollGenerationJob(input.jobId, replicateKey);
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
        replicateApiKey: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const replicateKey = resolveKey(ENV.replicateApiKey, input.replicateApiKey);
        const jobs = await Promise.all(
          input.jobIds.map((jobId) => pollGenerationJob(jobId, replicateKey))
        );
        return { success: true, data: jobs };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to poll jobs",
        };
      }
    }),

  // ============================================================
  // GENERATE MASTER PROMPT FOR CONSISTENCY
  // ============================================================
  generateMasterPrompt: protectedProcedure
    .input(
      z.object({
        deity: z.string(),
        lyrics: z.string().optional(),
        customDirection: z.string().optional(),
        category: z.enum(["devotional", "cinematic", "folk", "romantic", "emotional", "festival", "mass"]),
        mood: z.string().optional(),
        languageStyle: z.enum(["pure_telugu", "colloquial", "poetic", "mixed"]).optional(),
        outputType: z.enum(["lyrics_only", "lyrics_suno", "lyrics_scene"]).optional(),
        duration: z.number().min(1).max(10).optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const llmModel = input.llmModel || userSettings?.llmModel || "gemini-2.5-flash";

        const categoryDescriptions: Record<string, string> = {
          devotional: "a spiritual and devotional song",
          cinematic: "a cinematic and narrative-driven song",
          folk: "a folk and traditional song",
          romantic: "a romantic and emotional song",
          emotional: "an emotional and heartfelt song",
          festival: "a festival and celebratory song",
          mass: "a mass and commercial song",
        };

        const response = await invokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  `You are a master creative director for ${categoryDescriptions[input.category]}. ` +
                  `Your task is to create a comprehensive Master Prompt that will guide ALL downstream creative work (image generation, video creation, music styling, and marketing). ` +
                  `The Master Prompt must be: (1) Faithful to the original subject and theme, (2) Specific and vivid with visual/emotional details, (3) Consistent across all interpretations, (4) Flexible enough for artistic variation within the theme. ` +
                  `For ${input.category} content, apply appropriate constraints: devotional content must stay true to spiritual themes, cinematic allows narrative flexibility, etc.`,
              },
              {
                role: "user",
                content: input.lyrics
                  ? `Subject: ${input.deity}\n` +
                    `Category: ${input.category}\n` +
                    `Mood: ${input.mood || "meditative and devotional"}\n` +
                    `Lyrics (excerpt): ${input.lyrics.substring(0, 300)}...\n` +
                    `Creative Direction: ${input.customDirection || ""}\n\n` +
                    `Create a Master Prompt (150-250 words) that captures the core creative vision. Include: visual aesthetic, emotional tone, key themes, cultural/spiritual elements, character descriptions (if applicable), color palette, atmosphere, and any specific constraints to maintain consistency. This prompt will be used to generate images, videos, music styling, and marketing materials.`
                  : `Subject: ${input.deity}\n` +
                    `Category: ${input.category}\n` +
                    `Mood: ${input.mood || "meditative and devotional"}\n` +
                    `Language Style: ${input.languageStyle || "pure_telugu"}\n` +
                    `Output Type: ${input.outputType || "lyrics_suno"}\n` +
                    `Duration: ${input.duration || 4} minutes\n` +
                    `Creative Direction: ${input.customDirection || "No specific direction provided"}\n\n` +
                    `Create a comprehensive Creative Direction (Master Prompt) for a ${input.category} song (150-250 words). This will guide the generation of lyrics, music, visuals, and marketing. Include: song concept, emotional tone, story arc, devotional/cinematic angle, language style, structure, rhythm guidance, music direction, and things to avoid. Be specific and vivid.`,
              },
            ],
          },
          buildLlmOptions(userSettings, llmModel)
        );

        const masterPrompt =
          typeof response.choices?.[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "Unable to generate master prompt";

        void recordCost(ctx.user.id, "lyrics", llmModel, UNIT_COSTS.lyrics);
        return { success: true, data: { masterPrompt } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate master prompt",
        };
      }
    }),

  // ============================================================
  // REFINE MASTER PROMPT BASED ON FEEDBACK
  // ============================================================
  refineMasterPrompt: protectedProcedure
    .input(
      z.object({
        currentMasterPrompt: z.string(),
        feedback: z.string(),
        category: z.enum(["devotional", "cinematic", "folk", "romantic", "emotional", "festival", "mass"]),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const llmModel = input.llmModel || userSettings?.llmModel || "gemini-2.5-flash";

        const response = await invokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  `You are a master creative director refining a creative brief. ` +
                  `Your task is to update the Master Prompt based on user feedback while maintaining the core theme and vision. ` +
                  `Keep the same subject and spiritual/thematic essence, but adjust the aesthetic, mood, or specific details as requested.`,
              },
              {
                role: "user",
                content:
                  `Current Master Prompt:\n${input.currentMasterPrompt}\n\n` +
                  `User Feedback: ${input.feedback}\n\n` +
                  `Please refine the Master Prompt based on this feedback. Keep it 150-250 words. Maintain the core theme and subject, but adjust the aesthetic, mood, visual details, or emphasis as requested.`,
              },
            ],
          },
          buildLlmOptions(userSettings, llmModel)
        );

        const refinedMasterPrompt =
          typeof response.choices?.[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "Unable to refine master prompt";

        void recordCost(ctx.user.id, "lyrics", llmModel, UNIT_COSTS.lyrics);
        return { success: true, data: { masterPrompt: refinedMasterPrompt } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to refine master prompt",
        };
      }
    }),

  generateYoutubeMetadata: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        deity: z.string(),
        category: z.string(),
        mood: z.string(),
        masterPrompt: z.string(),
        lyrics: z.string().optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { generateSeoMetadata, getTrendingKeywords } = await import(
          "../_core/teluguSeo"
        );

        // Generate SEO-optimized metadata
        const seoMetadata = generateSeoMetadata({
          deity: input.deity,
          category: input.category,
          mood: input.mood,
          masterPrompt: input.masterPrompt,
          language: "telugu",
        });

        // Get trending keywords for the deity
        const trendingKeywords = getTrendingKeywords(input.deity);

        // Combine all keywords and hashtags
        const allKeywords = Array.from(new Set([...seoMetadata.keywords, ...trendingKeywords]));
        const allHashtags = Array.from(new Set(seoMetadata.hashtags));

        // Generate additional YouTube-specific content
        const llmModel = input.llmModel || "gemini-2.5-flash";
        const userSettings = await getUserSettings(ctx.user.id);
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                `You are an expert YouTube metadata specialist for Telugu devotional content. ` +
                `Generate compelling YouTube metadata that maximizes views and engagement. ` +
                `Focus on SEO optimization for Telugu audiences.`,
            },
            {
              role: "user",
              content:
                `Generate YouTube metadata for this devotional content:\n\n` +
                `Deity: ${input.deity}\n` +
                `Category: ${input.category}\n` +
                `Mood: ${input.mood}\n` +
                `Master Prompt: ${input.masterPrompt}\n\n` +
                `Generate:\n` +
                `1. An engaging title (50-60 characters)\n` +
                `2. A compelling description (150-300 characters)\n` +
                `3. 5-10 relevant keywords\n` +
                `4. 5-10 relevant hashtags\n\n` +
                `Format as JSON: { title, description, keywords: [], hashtags: [] }`,
            },
          ],
        }, buildLlmOptions(userSettings, llmModel));

        const llmMetadata = JSON.parse(
          typeof response.choices?.[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "{}"
        );

        // Combine SEO metadata with LLM-generated metadata
        const finalMetadata = {
          title: llmMetadata.title || seoMetadata.title,
          description: llmMetadata.description || seoMetadata.description,
          keywords: Array.from(new Set([...allKeywords, ...(llmMetadata.keywords || [])])),
          hashtags: Array.from(new Set([...allHashtags, ...(llmMetadata.hashtags || [])])),
          seoScore: seoMetadata.seoScore,
        };

        // Save to project
        const db = await getDb();
        if (!db) throw new Error("Database is not configured");
        const existingRows = await db
          .select({ metadata: projects.metadata })
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);
        const existingMetadata =
          existingRows[0]?.metadata && typeof existingRows[0].metadata === "object"
            ? existingRows[0].metadata as Record<string, unknown>
            : {};
        await db
          .update(projects)
          .set({
            metadata: {
              ...existingMetadata,
              youtubeTitle: finalMetadata.title,
              youtubeDescription: finalMetadata.description,
              youtubeTags: finalMetadata.hashtags,
            },
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        void recordCost(ctx.user.id, "lyrics", llmModel, UNIT_COSTS.lyrics);

        return {
          success: true,
          data: finalMetadata,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate YouTube metadata",
        };
      }
    }),

  // ============================================================
  // IMPROVE A SINGLE IMAGE OR MOTION PROMPT WITH AI
  // ============================================================
  improvePrompt: protectedProcedure
    .input(
      z.object({
        type: z.enum(["image", "motion"]),
        currentPrompt: z.string(),
        sceneDescription: z.string().optional(),
        lyricLine: z.string().optional(),
        deity: z.string().optional(),
        masterPrompt: z.string().optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await assertBudgetAvailable(ctx.user.id);
        const userSettings = await getUserSettings(ctx.user.id);
        const llmModel = input.llmModel || userSettings?.llmModel || "gemini-2.5-flash";

        const isImage = input.type === "image";

        const systemPrompt = isImage
          ? `You are an expert at writing image generation prompts for AI art tools (Stable Diffusion, Flux, DALL-E, Seedream).
Your task is to improve a single image prompt for a devotional music video scene.
Rules:
- Keep the spiritual/devotional subject faithful (deity, temple setting, sacred items)
- Add specific visual details: lighting, composition, color palette, art style
- Include quality boosters: cinematic lighting, highly detailed, 4K, professional photography
- Keep it under 120 words
- Return ONLY the improved prompt — no explanation, no quotes, no extra text`
          : `You are an expert at writing motion prompts for AI video generation tools (Runway, Kling, Pika, fal.ai).
Your task is to improve a single motion prompt for a devotional music video scene.
Rules:
- The deity/main subject must remain STILL — no body movement, no dancing, no wiggling
- Only allowed movement: petals falling, lamp flame flicker, light glow pulse, slow camera zoom
- Describe camera motion clearly: slow zoom in, gentle pan, static shot
- Keep the sacred and serene atmosphere
- Keep it under 80 words
- Return ONLY the improved prompt — no explanation, no quotes, no extra text`;

        const userMessage = [
          input.deity ? `Deity/Subject: ${input.deity}` : "",
          input.lyricLine ? `Lyric line: ${input.lyricLine}` : "",
          input.sceneDescription ? `Scene description: ${input.sceneDescription}` : "",
          input.masterPrompt ? `Master prompt context: ${input.masterPrompt}` : "",
          `Current prompt to improve:\n${input.currentPrompt}`,
        ].filter(Boolean).join("\n");

        const response = await invokeLLM(
          {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            maxTokens: 300,
          },
          buildLlmOptions(userSettings, llmModel)
        );

        const improved =
          typeof response.choices?.[0]?.message?.content === "string"
            ? response.choices[0].message.content.trim()
            : null;

        if (!improved) throw new Error("LLM returned empty response");

        void recordCost(ctx.user.id, "lyrics", llmModel, UNIT_COSTS.lyrics);
        return { success: true, data: { improved } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to improve prompt",
        };
      }
    }),
});
