import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserSettings, upsertUserSettings } from "../db";

export const settingsRouter = router({
  // Get user settings
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await getUserSettings(ctx.user.id);
    return settings || null;
  }),

  // Save API keys
  saveApiKeys: protectedProcedure
    .input(
      z.object({
        openaiApiKey: z.string().optional(),
        claudeApiKey: z.string().optional(),
        geminiApiKey: z.string().optional(),
        replicateApiKey: z.string().optional(),
        dallEApiKey: z.string().optional(),
        midjourneyApiKey: z.string().optional(),
        grokApiKey: z.string().optional(),
        pikaApiKey: z.string().optional(),
        groqApiKey: z.string().optional(),
        mistralApiKey: z.string().optional(),
        falApiKey: z.string().optional(),
        togetherApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await upsertUserSettings(ctx.user.id, input);
      return updated || null;
    }),

  // Save provider preferences + LLM model selection
  saveProviders: protectedProcedure
    .input(
      z.object({
        lyricsProvider: z.enum(["chatgpt", "claude", "gemini"]).optional(),
        imageProvider: z.enum(["flux", "dalle", "midjourney"]).optional(),
        videoProvider: z.enum(["runway", "grok", "pika"]).optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await upsertUserSettings(ctx.user.id, input);
      return updated || null;
    }),

  // Save budget
  saveBudget: protectedProcedure
    .input(
      z.object({
        monthlyBudgetUSD: z.number().positive().optional(),
        budgetResetDay: z.number().min(1).max(31).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings: any = {};
      if (input.monthlyBudgetUSD !== undefined) {
        settings.monthlyBudgetUSD = input.monthlyBudgetUSD.toString();
      }
      if (input.budgetResetDay !== undefined) {
        settings.budgetResetDay = input.budgetResetDay;
      }
      const updated = await upsertUserSettings(ctx.user.id, settings);
      return updated || null;
    }),
});
