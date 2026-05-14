/**
 * Database Optimization Utilities
 * Implements caching, query optimization, and performance monitoring
 */

import { db } from "../db";
import { projects, jobs, userSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * In-memory cache with TTL support
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number; // in milliseconds

  constructor(ttlSeconds: number = 300) {
    this.defaultTTL = ttlSeconds * 1000;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const expiresAt = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global caches for frequently accessed data
 */
export const deityContextCache = new TTLCache<Record<string, unknown>>(600); // 10 minutes
export const userSettingsCache = new TTLCache<Record<string, unknown>>(300); // 5 minutes
export const projectCache = new TTLCache<Record<string, unknown>>(180); // 3 minutes

/**
 * Query optimization: Batch load deity contexts
 */
export async function loadDeityContextBatch(deities: string[]): Promise<Map<string, Record<string, unknown>>> {
  const results = new Map<string, Record<string, unknown>>();
  const uncachedDeities: string[] = [];

  // Check cache first
  for (const deity of deities) {
    const cached = deityContextCache.get(deity);
    if (cached) {
      results.set(deity, cached);
    } else {
      uncachedDeities.push(deity);
    }
  }

  // Load uncached deities from database
  if (uncachedDeities.length > 0) {
    // Simulate loading from database (in real implementation, query database)
    for (const deity of uncachedDeities) {
      const context = {
        deity,
        loadedAt: new Date(),
        // Add deity-specific context here
      };
      results.set(deity, context);
      deityContextCache.set(deity, context, 600); // Cache for 10 minutes
    }
  }

  return results;
}

/**
 * Query optimization: Load user settings with caching
 */
export async function loadUserSettingsOptimized(userId: number): Promise<Record<string, unknown> | null> {
  const cacheKey = `user-${userId}`;
  const cached = userSettingsCache.get(cacheKey);
  if (cached) return cached;

  try {
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length > 0) {
      const settingsObj = settings[0] as Record<string, unknown>;
      userSettingsCache.set(cacheKey, settingsObj, 300);
      return settingsObj;
    }
  } catch (error) {
    console.error(`Failed to load user settings for user ${userId}:`, error);
  }

  return null;
}

/**
 * Query optimization: Load project with caching
 */
export async function loadProjectOptimized(projectId: number): Promise<Record<string, unknown> | null> {
  const cacheKey = `project-${projectId}`;
  const cached = projectCache.get(cacheKey);
  if (cached) return cached;

  try {
    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectList.length > 0) {
      const projectObj = projectList[0] as Record<string, unknown>;
      projectCache.set(cacheKey, projectObj, 180);
      return projectObj;
    }
  } catch (error) {
    console.error(`Failed to load project ${projectId}:`, error);
  }

  return null;
}

/**
 * Query optimization: Batch load projects
 */
export async function loadProjectsBatch(projectIds: number[]): Promise<Map<number, Record<string, unknown>>> {
  const results = new Map<number, Record<string, unknown>>();
  const uncachedIds: number[] = [];

  // Check cache first
  for (const id of projectIds) {
    const cached = projectCache.get(`project-${id}`);
    if (cached) {
      results.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // Load uncached projects from database
  if (uncachedIds.length > 0) {
    try {
      const projectList = await db
        .select()
        .from(projects)
        .where((col) => uncachedIds.includes(col.id));

      for (const project of projectList) {
        const projectObj = project as Record<string, unknown>;
        results.set(project.id, projectObj);
        projectCache.set(`project-${project.id}`, projectObj, 180);
      }
    } catch (error) {
      console.error("Failed to batch load projects:", error);
    }
  }

  return results;
}

/**
 * Invalidate caches for specific entities
 */
export function invalidateDeityCache(deity: string): void {
  deityContextCache.cache.delete(deity);
}

export function invalidateUserSettingsCache(userId: number): void {
  userSettingsCache.cache.delete(`user-${userId}`);
}

export function invalidateProjectCache(projectId: number): void {
  projectCache.cache.delete(`project-${projectId}`);
}

/**
 * Periodic cache cleanup (should be called by a background job)
 */
export function cleanupCaches(): void {
  deityContextCache.cleanup();
  userSettingsCache.cleanup();
  projectCache.cleanup();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  deityCache: { size: number; ttl: number };
  userSettingsCache: { size: number; ttl: number };
  projectCache: { size: number; ttl: number };
} {
  return {
    deityCache: { size: deityContextCache.size(), ttl: 600 },
    userSettingsCache: { size: userSettingsCache.size(), ttl: 300 },
    projectCache: { size: projectCache.size(), ttl: 180 },
  };
}

/**
 * Database index recommendations
 * These should be created in the database migration
 */
export const INDEX_RECOMMENDATIONS = [
  {
    table: "projects",
    columns: ["userId", "createdAt"],
    reason: "Optimize user project listing and filtering by date",
  },
  {
    table: "projects",
    columns: ["userId", "status"],
    reason: "Optimize filtering projects by user and status",
  },
  {
    table: "projects",
    columns: ["category", "deity"],
    reason: "Optimize filtering by category and deity",
  },
  {
    table: "jobs",
    columns: ["projectId", "status"],
    reason: "Optimize job tracking and filtering",
  },
  {
    table: "jobs",
    columns: ["userId", "createdAt"],
    reason: "Optimize user job history queries",
  },
  {
    table: "userSettings",
    columns: ["userId"],
    reason: "Optimize user settings lookup",
  },
];

/**
 * Query performance monitoring
 */
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  slow: boolean;
}

const queryMetrics: QueryMetrics[] = [];
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

export function recordQueryMetric(query: string, duration: number): void {
  const metric: QueryMetrics = {
    query,
    duration,
    timestamp: new Date(),
    slow: duration > SLOW_QUERY_THRESHOLD,
  };

  queryMetrics.push(metric);

  // Keep only last 1000 metrics
  if (queryMetrics.length > 1000) {
    queryMetrics.shift();
  }

  if (metric.slow) {
    console.warn(`[SLOW QUERY] ${query} took ${duration}ms`);
  }
}

export function getQueryMetrics(): {
  total: number;
  slow: number;
  avgDuration: number;
  slowQueries: QueryMetrics[];
} {
  const slowQueries = queryMetrics.filter((m) => m.slow);
  const avgDuration =
    queryMetrics.length > 0
      ? queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length
      : 0;

  return {
    total: queryMetrics.length,
    slow: slowQueries.length,
    avgDuration: Math.round(avgDuration * 100) / 100,
    slowQueries: slowQueries.slice(-10), // Last 10 slow queries
  };
}

/**
 * Archive old projects to improve query performance
 */
export async function archiveOldProjects(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // In a real implementation, this would move projects to an archive table
    // For now, we just count how many would be archived
    const oldProjects = await db
      .select()
      .from(projects)
      .where((col) => col.updatedAt < cutoffDate);

    console.log(`Found ${oldProjects.length} projects older than ${daysOld} days`);
    return oldProjects.length;
  } catch (error) {
    console.error("Failed to archive old projects:", error);
    return 0;
  }
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  metrics: {
    projectCount: number;
    jobCount: number;
    avgQueryTime: number;
    cacheHealth: ReturnType<typeof getCacheStats>;
  };
}> {
  try {
    const projectCount = await db.select().from(projects);
    const jobCount = await db.select().from(jobs);
    const queryMetrics = getQueryMetrics();
    const cacheHealth = getCacheStats();

    return {
      healthy: true,
      metrics: {
        projectCount: projectCount.length,
        jobCount: jobCount.length,
        avgQueryTime: queryMetrics.avgDuration,
        cacheHealth,
      },
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      healthy: false,
      metrics: {
        projectCount: 0,
        jobCount: 0,
        avgQueryTime: 0,
        cacheHealth: getCacheStats(),
      },
    };
  }
}
