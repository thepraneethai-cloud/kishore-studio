// ============================================================
// tRPC Routers for Background Job Management
// ============================================================

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { jobs } from "../../drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export const jobsRouter = router({
  // Create a new background job
  createJob: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        type: z.enum(["lyrics", "image", "video", "scene_generation"]),
        provider: z.string(),
        input: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobId = randomUUID();
      const jobData = {
        id: jobId,
        projectId: input.projectId,
        userId: ctx.user.id,
        type: input.type,
        provider: input.provider,
        status: "queued" as const,
        input: input.input,
        retryCount: 0,
      };

      await db.insert(jobs).values(jobData as any);
      return { jobId, status: "queued" };
    }),

  // Get job status
  getJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.select().from(jobs).where(eq(jobs.id, input.jobId));
      if (!result.length) throw new Error("Job not found");

      const job = result[0];
      if (job.userId !== ctx.user.id) throw new Error("Unauthorized");

      return job;
    }),

  // Get all jobs for a project
  getProjectJobs: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.select().from(jobs).where(eq(jobs.projectId, input.projectId));
      return result.filter((j) => j.userId === ctx.user.id);
    }),

  // Update job status (for polling)
  updateJobStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        status: z.enum(["queued", "processing", "succeeded", "failed", "cancelled"]),
        output: z.record(z.string(), z.any()).optional(),
        errorMessage: z.string().optional(),
        cost: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const jobList = await db.select().from(jobs).where(eq(jobs.id, input.jobId));
      const job = jobList[0];
      if (!job || job.userId !== ctx.user.id) throw new Error("Unauthorized");

      const updateData: any = {
        status: input.status,
      };

      if (input.output) updateData.output = input.output;
      if (input.errorMessage) updateData.errorMessage = input.errorMessage;
      if (input.cost) updateData.cost = input.cost;

      if (input.status === "succeeded" || input.status === "failed") {
        updateData.completedAt = new Date();
      }

      await db.update(jobs).set(updateData as any).where(eq(jobs.id, input.jobId));

      return { success: true };
    }),

  // Poll multiple jobs at once
  pollJobs: protectedProcedure
    .input(z.object({ jobIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.jobIds.length === 0) return [];

      return db
        .select()
        .from(jobs)
        .where(and(inArray(jobs.id, input.jobIds), eq(jobs.userId, ctx.user.id)));
    }),

  // Cancel a job
  cancelJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobList = await db.select().from(jobs).where(eq(jobs.id, input.jobId));
      const job = jobList[0];
      if (!job || job.userId !== ctx.user.id) throw new Error("Unauthorized");

      if (job.status !== "queued" && job.status !== "processing") {
        throw new Error("Cannot cancel a completed job");
      }

      await db.update(jobs).set({ status: "cancelled" }).where(eq(jobs.id, input.jobId));

      return { success: true };
    }),

  // Retry a failed job
  retryJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [job] = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
      if (!job || job.userId !== ctx.user.id) throw new Error("Unauthorized");

      if (job.status !== "failed") {
        throw new Error("Can only retry failed jobs");
      }

      const maxRetries = 3;
      if ((job.retryCount || 0) >= maxRetries) {
        throw new Error(`Max retries (${maxRetries}) exceeded`);
      }

      await db
        .update(jobs)
        .set({
          status: "queued",
          retryCount: (job.retryCount || 0) + 1,
          errorMessage: null,
        })
        .where(eq(jobs.id, input.jobId));

      return { success: true };
    }),

  // Get jobs by status
  getJobsByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["queued", "processing", "succeeded", "failed", "cancelled"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.select().from(jobs).where(eq(jobs.status, input.status));
      return result.filter((j) => j.userId === ctx.user.id);
    }),
});
