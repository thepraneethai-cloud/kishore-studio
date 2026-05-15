import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects, scenes as scenesTable, jobs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { deleteFromR2, r2KeyFromUrl } from "../_core/r2Storage";

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
        audioUrl: z.string().optional(),
        masterPrompt: z.string().optional(),
        creativeBrief: z.string().optional(),
        extraDirection: z.string().optional(),
        sunoStyle: z.record(z.string(), z.unknown()).optional(),
        scenes: z.array(z.unknown()).optional(),
        youtubeTitle: z.string().optional(),
        youtubeDescription: z.string().optional(),
        youtubeTags: z.array(z.string()).optional(),
        thumbnailPrompt: z.string().optional(),
        completedSteps: z.array(z.number()).optional(),
        activeStep: z.number().optional(),
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
        masterPrompt: input.masterPrompt ?? "",
        completedSteps: input.completedSteps ?? [],
        activeStep: input.activeStep ?? 1,
      };

      if (input.serverProjectId) {
        // Update existing — ownership check prevents cross-user writes
        await db
          .update(projects)
          .set({
            name: input.title || "Untitled",
            deity: input.deity ?? null,
            lyrics: input.lyrics ?? "",
            audioUrl: input.audioUrl ?? "",
            masterPrompt: input.masterPrompt ?? "",
            creativeBrief: input.creativeBrief ?? "",
            extraDirection: input.extraDirection ?? "",
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
          audioUrl: input.audioUrl ?? "",
          masterPrompt: input.masterPrompt ?? "",
          creativeBrief: input.creativeBrief ?? "",
          extraDirection: input.extraDirection ?? "",
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
  // DELETE — remove a project and all associated data (ownership-checked)
  // ============================================================
  delete: protectedProcedure
    .input(z.object({ serverProjectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Fetch project first so we can gather R2 keys to clean up
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

      if (!project) return { success: true }; // already gone

      // Collect R2 keys from project-level fields
      const r2Keys: string[] = [];
      for (const url of [project.audioUrl]) {
        if (url) { const k = r2KeyFromUrl(url); if (k) r2Keys.push(k); }
      }

      // Collect R2 keys from scenes stored in metadata JSON
      const meta = (project.metadata ?? {}) as { scenes?: Array<{ imageUrl?: string; videoUrl?: string }> };
      for (const scene of meta.scenes ?? []) {
        for (const url of [scene.imageUrl, scene.videoUrl]) {
          if (url) { const k = r2KeyFromUrl(url); if (k) r2Keys.push(k); }
        }
      }

      // Collect R2 keys from scenes table rows
      const sceneRows = await db
        .select({ imageUrl: scenesTable.imageUrl, videoUrl: scenesTable.videoUrl })
        .from(scenesTable)
        .where(eq(scenesTable.projectId, input.serverProjectId));
      for (const row of sceneRows) {
        for (const url of [row.imageUrl, row.videoUrl]) {
          if (url) { const k = r2KeyFromUrl(url); if (k) r2Keys.push(k); }
        }
      }

      // Delete R2 objects (best effort — don't block project deletion if this fails)
      try { await deleteFromR2(r2Keys); } catch (e) {
        console.error("[projects.delete] R2 cleanup failed (ignored):", e);
      }

      // Delete child rows first, then the project
      await db.delete(jobs).where(eq(jobs.projectId, input.serverProjectId));
      await db.delete(scenesTable).where(eq(scenesTable.projectId, input.serverProjectId));
      await db.delete(projects).where(eq(projects.id, input.serverProjectId));

      return { success: true };
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
