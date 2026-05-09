import { TRPCError } from "@trpc/server";
import { and, eq, gte } from "drizzle-orm";
import { costTracking, userSettings } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Throws FORBIDDEN if the user has spent at or above their monthly budget.
 * Silently passes if the DB is unavailable — generation should degrade gracefully,
 * not become completely blocked due to a DB outage.
 */
export async function assertBudgetAvailable(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[BudgetCheck] DB unavailable — skipping budget check for user", userId);
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [costs, settings] = await Promise.all([
    db
      .select({ cost: costTracking.cost })
      .from(costTracking)
      .where(and(eq(costTracking.userId, userId), gte(costTracking.date, monthStart))),
    db
      .select({ monthlyBudgetUSD: userSettings.monthlyBudgetUSD })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1),
  ]);

  const totalSpent = costs.reduce((sum, c) => {
    const n = typeof c.cost === "string" ? parseFloat(c.cost) : Number(c.cost);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const monthlyBudget = settings.length
    ? parseFloat(settings[0].monthlyBudgetUSD?.toString() ?? "50")
    : 50;

  if (totalSpent >= monthlyBudget) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Monthly budget of $${monthlyBudget.toFixed(2)} exceeded (spent: $${totalSpent.toFixed(2)}). Update your limit in Settings.`,
    });
  }
}
