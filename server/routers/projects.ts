import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const projectsRouter = router({
  // ============================================================
  // UPSERT — create on first save, update on subsequent saves
  // ============================================================
  upsert: protectedProcedure
    .input(
      z.object({
        serverProjectId: z.number().optional(),
        title: z.string(),
        deity: z.string().nullable().optional(),
        lyrics: z.string().optional(),
        sunoStyle: z.record(z.unknown()).optional(),
        scenes: z.array(z.unknown()).optional(),
        youtubeTitle: z.string().optional(),
        youtubeDescription: z.string().optional(),
        youtubeTags: z.array(z.string()).optional(),
        thumbnailPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const metadata = {
        scenes: input.scenes ?? [],
        youtubeTitle: input.youtubeTitle ?? "",
        youtubeDescription: input.youtubeDescription ?? "",
        youtubeTags: input.youtubeTags ?? [],
        thumbnailPrompt: input.thumbnailPrompt ?? "",
      };

      if (input.serverProjectId) {
        // Update existing — ownership check prevents cross-user writes
        await db
          .update(projects)
          .set({
            name: input.title || "Untitled",
            deity: input.deity ?? null,
            lyrics: input.lyrics ?? "",
            sunoStyle: input.sunoStyle,
            metadata,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, input.serverProjectId),
              eq(projects.userId, ctx.user.id)
            )
          );
        return { serverProjectId: input.serverProjectId };
      }

      const [result] = await db
        .insert(projects)
        .values({
          userId: ctx.user.id,
          name: input.title || "Untitled",
          type: "devotional",
          status: "draft",
          deity: input.deity ?? null,
          lyrics: input.lyrics ?? "",
          sunoStyle: input.sunoStyle,
          metadata,
        })
        .$returningId();

      return { serverProjectId: result.id };
    }),

  // ============================================================
  // LOAD — restore a saved project by server id
  // ============================================================
  load: protectedProcedure
    .input(z.object({ serverProjectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, input.serverProjectId),
            eq(projects.userId, ctx.user.id)
          )
        )
        .limit(1);

      return project ?? null;
    }),

  // ============================================================
  // LIST — summary list for project picker
  // ============================================================
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    return db
      .select({
        id: projects.id,
        name: projects.name,
        deity: projects.deity,
        status: projects.status,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.userId, ctx.user.id));
  }),
});
