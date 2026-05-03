// ============================================================
// Background Job Processor Service
// Handles async execution of queued generation tasks
// ============================================================

import { getDb } from "../db";
import { jobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface JobProcessorConfig {
  maxConcurrent?: number;
  pollIntervalMs?: number;
  maxRetries?: number;
}

class JobProcessor {
  private config: Required<JobProcessorConfig>;
  private activeJobs = new Set<string>();
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(config: JobProcessorConfig = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      pollIntervalMs: config.pollIntervalMs || 30000,
      maxRetries: config.maxRetries || 3,
    };
  }

  // Start the job processor
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[JobProcessor] Started");

    this.pollInterval = setInterval(() => {
      this.processNextBatch();
    }, this.config.pollIntervalMs);

    // Process initial batch
    await this.processNextBatch();
  }

  // Stop the job processor
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log("[JobProcessor] Stopped");
  }

  // Process the next batch of queued jobs
  private async processNextBatch() {
    const db = await getDb();
    if (!db) return;

    // Get queued jobs up to max concurrent
    const availableSlots = this.config.maxConcurrent - this.activeJobs.size;
    if (availableSlots <= 0) return;

    try {
      const queuedJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.status, "queued"))
        .limit(availableSlots);

      for (const job of queuedJobs) {
        this.activeJobs.add(job.id);
        this.processJob(job).catch((error) => {
          console.error(`[JobProcessor] Error processing job ${job.id}:`, error);
        });
      }
    } catch (error: any) {
      // Silently handle connection resets - they're transient
      if (error?.cause?.message?.includes('ECONNRESET') || error?.message?.includes('ECONNRESET')) {
        // Transient DB connection error, will retry on next poll
        return;
      }
      console.error("[JobProcessor] Error fetching queued jobs:", error?.message || error);
    }
  }

  // Process a single job
  private async processJob(job: any) {
    const db = await getDb();
    if (!db) {
      this.activeJobs.delete(job.id);
      return;
    }

    try {
      // Update status to processing
      await db.update(jobs).set({ status: "processing" }).where(eq(jobs.id, job.id));

      // Simulate job execution (in real app, call actual APIs)
      const result = await this.executeJob(job);

      // Update job with result
      await db
        .update(jobs)
        .set({
          status: "succeeded",
          output: result,
          completedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.log(`[JobProcessor] Job ${job.id} completed successfully`);
    } catch (error: any) {
      // Handle job failure
      const retryCount = (job.retryCount || 0) + 1;
      const shouldRetry = retryCount < this.config.maxRetries;

      await db
        .update(jobs)
        .set({
          status: shouldRetry ? "queued" : "failed",
          errorMessage: error.message,
          retryCount,
          completedAt: shouldRetry ? null : new Date(),
        })
        .where(eq(jobs.id, job.id));

      if (shouldRetry) {
        console.log(`[JobProcessor] Job ${job.id} will be retried (attempt ${retryCount})`);
      } else {
        console.error(`[JobProcessor] Job ${job.id} failed after ${retryCount} attempts`);
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  // Execute the actual job logic
  private async executeJob(job: any): Promise<any> {
    const { type, input } = job;

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    switch (type) {
      case "lyrics":
        return this.generateLyrics(input);
      case "image":
        return this.generateImage(input);
      case "video":
        return this.generateVideo(input);
      case "scene_generation":
        return this.generateScenes(input);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  // Placeholder implementations for different job types
  private async generateLyrics(input: any): Promise<any> {
    // In real app, call ChatGPT/Claude/Gemini API
    return {
      lyrics: `[Pallavi]\nGenerated lyrics for ${input.deity || "deity"}\n\n[Charanam 1]\nVerse 1...`,
      provider: input.provider,
      timestamp: new Date().toISOString(),
    };
  }

  private async generateImage(input: any): Promise<any> {
    // In real app, call Flux/DALL-E/Midjourney API
    return {
      imageUrl: `https://placeholder.example.com/image-${Date.now()}.jpg`,
      provider: input.provider,
      timestamp: new Date().toISOString(),
    };
  }

  private async generateVideo(input: any): Promise<any> {
    // In real app, call Runway/Grok/Pika API
    return {
      videoUrl: `https://placeholder.example.com/video-${Date.now()}.mp4`,
      provider: input.provider,
      timestamp: new Date().toISOString(),
    };
  }

  private async generateScenes(input: any): Promise<any> {
    // In real app, generate scenes from story
    return {
      scenes: [
        { sceneNumber: 1, description: "Scene 1 description" },
        { sceneNumber: 2, description: "Scene 2 description" },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Get job statistics
  async getStats() {
    const db = await getDb();
    if (!db) return null;

    const [queued, processing, succeeded, failed] = await Promise.all([
      db.select().from(jobs).where(eq(jobs.status, "queued")),
      db.select().from(jobs).where(eq(jobs.status, "processing")),
      db.select().from(jobs).where(eq(jobs.status, "succeeded")),
      db.select().from(jobs).where(eq(jobs.status, "failed")),
    ]);

    return {
      queued: queued.length,
      processing: processing.length,
      succeeded: succeeded.length,
      failed: failed.length,
      active: this.activeJobs.size,
    };
  }
}

// Global job processor instance
let processorInstance: JobProcessor | null = null;

export function getJobProcessor(config?: JobProcessorConfig): JobProcessor {
  if (!processorInstance) {
    processorInstance = new JobProcessor(config);
  }
  return processorInstance;
}

export async function startJobProcessor(config?: JobProcessorConfig) {
  const processor = getJobProcessor(config);
  await processor.start();
  return processor;
}

export function stopJobProcessor() {
  if (processorInstance) {
    processorInstance.stop();
    processorInstance = null;
  }
}
