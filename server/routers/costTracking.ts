// ============================================================
// Cost Tracking Router - Track generation costs and budgets
// ============================================================

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { costTracking, userSettings } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// Cost estimates per provider (in USD)
const COST_ESTIMATES = {
  lyrics: {
    chatgpt: 0.002,
    claude: 0.003,
    gemini: 0.0001,
  },
  image: {
    flux: 0.01,
    dalle: 0.02,
    midjourney: 0.015,
  },
  video: {
    runway: 0.05,
    grok: 0.04,
    pika: 0.04,
  },
};

export const costTrackingRouter = router({
  // Get cost estimate before generation
  estimateCost: protectedProcedure
    .input(
      z.object({
        type: z.enum(["lyrics", "image", "video"]),
        provider: z.string(),
        count: z.number().min(1).default(1),
      })
    )
    .query(({ input }) => {
      const costMap = COST_ESTIMATES[input.type] as Record<string, number>;
      const unitCost = costMap[input.provider] || 0.01;
      const totalCost = unitCost * input.count;

      return {
        unitCost,
        totalCost,
        count: input.count,
        provider: input.provider,
        type: input.type,
      };
    }),

  // Log a cost transaction
  logCost: protectedProcedure
    .input(
      z.object({
        type: z.enum(["lyrics", "image", "video"]),
        provider: z.string(),
        cost: z.number(),
        jobId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db.insert(costTracking).values({
          userId: ctx.user.id,
          type: input.type,
          provider: input.provider,
          cost: input.cost.toString(),
          jobId: input.jobId,
          date: new Date(),
        });

        return { success: true, cost: input.cost };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to log cost",
        };
      }
    }),

  // Get cost summary for current month
  getMonthlySummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const costs = await db
        .select()
        .from(costTracking)
        .where(
          and(
            eq(costTracking.userId, ctx.user.id),
            gte(costTracking.date, monthStart),
            lte(costTracking.date, monthEnd)
          )
        );

      const totalCost = costs.reduce((sum, c) => {
        const costNum = typeof c.cost === "string" ? parseFloat(c.cost) : c.cost;
        return sum + (costNum || 0);
      }, 0);

      const summary = {
        totalCost,
        byType: {
          lyrics: costs
            .filter((c) => c.type === "lyrics")
            .reduce((sum, c) => {
              const costNum = typeof c.cost === "string" ? parseFloat(c.cost) : c.cost;
              return sum + (costNum || 0);
            }, 0),
          image: costs
            .filter((c) => c.type === "image")
            .reduce((sum, c) => {
              const costNum = typeof c.cost === "string" ? parseFloat(c.cost) : c.cost;
              return sum + (costNum || 0);
            }, 0),
          video: costs
            .filter((c) => c.type === "video")
            .reduce((sum, c) => {
              const costNum = typeof c.cost === "string" ? parseFloat(c.cost) : c.cost;
              return sum + (costNum || 0);
            }, 0),
        },
        byProvider: {} as Record<string, number>,
        transactionCount: costs.length,
      };

      // Group by provider
      costs.forEach((c) => {
        if (c.provider) {
          const costNum = typeof c.cost === "string" ? parseFloat(c.cost) : c.cost;
          summary.byProvider[c.provider] =
            (summary.byProvider[c.provider] || 0) + (costNum || 0);
        }
      });

      return summary;
    } catch (error) {
      return {
        totalCost: 0,
        byType: { lyrics: 0, images: 0, videos: 0 },
        byProvider: {},
        transactionCount: 0,
        error: error instanceof Error ? error.message : "Failed to get summary",
      };
    }
  }),

  // Get budget settings
  getBudgetSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      if (!settings.length) {
        return {
          monthlyBudget: 50,
          budgetResetDay: 1,
        };
      }

      const s = settings[0];
      return {
        monthlyBudget: s.monthlyBudgetUSD
          ? parseFloat(s.monthlyBudgetUSD.toString())
          : 50,
        budgetResetDay: s.budgetResetDay || 1,
      };
    } catch (error) {
      return {
        monthlyBudget: 100,
        alertThreshold: 80,
        costLimitEnabled: true,
        error: error instanceof Error ? error.message : "Failed to get budget",
      };
    }
  }),

  // Update budget settings
  updateBudgetSettings: protectedProcedure
    .input(
      z.object({
        monthlyBudget: z.number().min(1).optional(),
        budgetResetDay: z.number().min(1).max(31).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const existing = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, ctx.user.id))
          .limit(1);

        if (existing.length) {
          await db
            .update(userSettings)
            .set({
              monthlyBudgetUSD: input.monthlyBudget
                ? input.monthlyBudget.toString()
                : undefined,
              budgetResetDay: input.budgetResetDay,
            })
            .where(eq(userSettings.userId, ctx.user.id));
        } else {
          await db.insert(userSettings).values({
            userId: ctx.user.id,
            monthlyBudgetUSD: input.monthlyBudget
              ? input.monthlyBudget.toString()
              : "50.00",
            budgetResetDay: input.budgetResetDay || 1,
          });
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update budget",
        };
      }
    }),

  // Check if budget exceeded
  checkBudgetStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const costs = await db
        .select()
        .from(costTracking)
        .where(
          and(
            eq(costTracking.userId, ctx.user.id),
            gte(costTracking.date, monthStart)
          )
        );

      const totalCost = costs.reduce((sum, c) => {
        const costNum = typeof c.cost === "string" ? parseFloat(c.cost) : c.cost;
        return sum + (costNum || 0);
      }, 0);

      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      const monthlyBudget = settings.length
        ? parseFloat(settings[0].monthlyBudgetUSD?.toString() || "50")
        : 50;

      return {
        totalCost,
        monthlyBudget,
        remaining: monthlyBudget - totalCost,
        percentUsed: (totalCost / monthlyBudget) * 100,
        isExceeded: totalCost > monthlyBudget,
        shouldAlert: totalCost > monthlyBudget * 0.8,
      };
    } catch (error) {
      return {
        totalCost: 0,
        monthlyBudget: 50,
        remaining: 50,
        percentUsed: 0,
        isExceeded: false,
        shouldAlert: false,
        error: error instanceof Error ? error.message : "Failed to check budget",
      };
    }
  }),
});
