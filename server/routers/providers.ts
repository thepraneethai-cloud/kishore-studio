// ============================================================
// DESIGN: Provider Router for Multi-AI Integration
// ============================================================

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserSettings, getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateLyricsWithChatGPT } from "../_core/providers/chatgpt";
import { generateLyricsWithClaude } from "../_core/providers/claude";
import { generateImagesWithFlux, generateImagesWithDALLE } from "../_core/providers/images";
import { LyricsProvider, ImageProvider, VideoProvider, validateProviderConfig } from "../_core/providers";
import { ENV } from "../_core/env";

function resolveKey(envKey: string, userSupplied?: string | null): string {
  return (envKey && envKey.length > 0) ? envKey : (userSupplied ?? "");
}

export const providersRouter = router({
  // ============================================================
  // UPDATE PROVIDER SETTINGS
  // ============================================================
  updateProviderSettings: protectedProcedure
    .input(
      z.object({
        lyricsProvider: z.enum(["gemini", "chatgpt", "claude"]).optional(),
        imageProvider: z.enum(["flux", "dall-e", "midjourney"]).optional(),
        videoProvider: z.enum(["runway", "grok", "pika"]).optional(),
        openaiApiKey: z.string().optional(),
        claudeApiKey: z.string().optional(),
        replicateApiKey: z.string().optional(),
        dallEApiKey: z.string().optional(),
        grokApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const updateData: Record<string, any> = {};
        if (input.lyricsProvider) updateData.lyricsProvider = input.lyricsProvider;
        if (input.imageProvider) updateData.imageProvider = input.imageProvider;
        if (input.videoProvider) updateData.videoProvider = input.videoProvider;
        if (input.openaiApiKey) updateData.openaiApiKey = input.openaiApiKey;
        if (input.claudeApiKey) updateData.claudeApiKey = input.claudeApiKey;
        if (input.replicateApiKey) updateData.replicateApiKey = input.replicateApiKey;
        if (input.dallEApiKey) updateData.dallEApiKey = input.dallEApiKey;
        if (input.grokApiKey) updateData.grokApiKey = input.grokApiKey;

        await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));

        return { success: true, message: "Provider settings updated" };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update provider settings",
        };
      }
    }),

  // ============================================================
  // GET PROVIDER SETTINGS
  // ============================================================
  getProviderSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userSettings = await getUserSettings(ctx.user.id);

      return {
        success: true,
        data: {
          lyricsProvider: userSettings?.lyricsProvider || "gemini",
          imageProvider: userSettings?.imageProvider || "flux",
          videoProvider: userSettings?.videoProvider || "runway",
          providers: {
            lyrics: {
              gemini: { configured: !!userSettings?.geminiApiKey },
              chatgpt: { configured: !!userSettings?.openaiApiKey },
              claude: { configured: !!userSettings?.claudeApiKey },
            },
            images: {
              flux: { configured: !!userSettings?.replicateApiKey },
              "dall-e": { configured: !!userSettings?.dallEApiKey },
              midjourney: { configured: !!userSettings?.midjourneyApiKey },
            },
            videos: {
              runway: { configured: !!userSettings?.replicateApiKey },
              grok: { configured: !!userSettings?.grokApiKey },
              pika: { configured: !!userSettings?.pikaApiKey },
            },
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get provider settings",
      };
    }
  }),

  // ============================================================
  // GENERATE LYRICS WITH SELECTED PROVIDER
  // ============================================================
  generateLyricsWithProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["gemini", "chatgpt", "claude"]),
        subject: z.string(),
        category: z.string(),
        mood: z.string(),
        duration: z.string(),
        languageStyle: z.string(),
        customDirection: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userSettings = await getUserSettings(ctx.user.id);

        switch (input.provider) {
          case "chatgpt": {
            const openaiKey = resolveKey(ENV.openaiApiKey, userSettings?.openaiApiKey);
            if (!openaiKey) {
              throw new Error("ChatGPT API key not configured");
            }
            const result = await generateLyricsWithChatGPT(
              {
                subject: input.subject,
                category: input.category,
                mood: input.mood,
                duration: input.duration,
                languageStyle: input.languageStyle,
                customDirection: input.customDirection,
              },
              { apiKey: openaiKey, model: "gpt-4o-mini" }
            );
            return { success: true, data: result };
          }

          case "claude": {
            const claudeKey = resolveKey(ENV.claudeApiKey, userSettings?.claudeApiKey);
            if (!claudeKey) {
              throw new Error("Claude API key not configured");
            }
            const result = await generateLyricsWithClaude(
              {
                subject: input.subject,
                category: input.category,
                mood: input.mood,
                duration: input.duration,
                languageStyle: input.languageStyle,
                customDirection: input.customDirection,
              },
              { apiKey: claudeKey, model: "claude-3-5-sonnet-20241022" }
            );
            return { success: true, data: result };
          }

          default:
            throw new Error(`Unsupported provider: ${input.provider}`);
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate lyrics",
        };
      }
    }),

  // ============================================================
  // GENERATE IMAGES WITH SELECTED PROVIDER
  // ============================================================
  generateImagesWithProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["flux", "dall-e"]),
        prompt: z.string(),
        count: z.number().min(1).max(4).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userSettings = await getUserSettings(ctx.user.id);

        switch (input.provider) {
          case "flux": {
            if (!userSettings?.replicateApiKey) {
              throw new Error("Flux API key not configured");
            }
            const result = await generateImagesWithFlux(
              { prompt: input.prompt, count: input.count || 1 },
              { apiKey: userSettings.replicateApiKey }
            );
            return { success: true, data: result };
          }

          case "dall-e": {
            if (!userSettings?.dallEApiKey) {
              throw new Error("DALL-E API key not configured");
            }
            const result = await generateImagesWithDALLE(
              { prompt: input.prompt, count: input.count || 1 },
              { apiKey: userSettings.dallEApiKey }
            );
            return { success: true, data: result };
          }

          default:
            throw new Error(`Unsupported provider: ${input.provider}`);
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate images",
        };
      }
    }),
});
