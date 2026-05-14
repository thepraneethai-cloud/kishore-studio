/**
 * Performance Optimization
 * Implements caching strategies, progressive generation, and lazy loading
 */

/**
 * Response caching with invalidation
 */
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[]; // For grouped invalidation
}

export class ResponseCache {
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private tags: Map<string, Set<string>> = new Map();

  set(config: CacheConfig, data: unknown): void {
    const expiresAt = Date.now() + config.ttl * 1000;
    this.cache.set(config.key, { data, expiresAt });

    // Track tags for invalidation
    if (config.tags) {
      for (const tag of config.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(config.key);
      }
    }
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    const keys = this.tags.get(tag);
    if (keys) {
      for (const key of keys) {
        this.cache.delete(key);
      }
      this.tags.delete(tag);
    }
  }

  clear(): void {
    this.cache.clear();
    this.tags.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const responseCache = new ResponseCache();

/**
 * Progressive Generation
 * Stream results as they become available instead of waiting for all
 */
export interface ProgressUpdate {
  stage: string;
  progress: number; // 0-100
  status: "pending" | "in_progress" | "complete" | "error";
  data?: unknown;
  error?: string;
}

export class ProgressiveGenerator {
  private updates: ProgressUpdate[] = [];
  private subscribers: Set<(update: ProgressUpdate) => void> = new Set();

  subscribe(callback: (update: ProgressUpdate) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  update(update: ProgressUpdate): void {
    this.updates.push(update);
    this.subscribers.forEach((callback) => callback(update));
  }

  getUpdates(): ProgressUpdate[] {
    return this.updates;
  }

  clear(): void {
    this.updates = [];
  }
}

/**
 * Lazy Loading for Large Datasets
 */
export interface LazyLoadConfig {
  pageSize: number;
  totalItems: number;
}

export class LazyLoader<T> {
  private config: LazyLoadConfig;
  private loadedPages: Map<number, T[]> = new Map();
  private loader: (pageNumber: number, pageSize: number) => Promise<T[]>;

  constructor(config: LazyLoadConfig, loader: (pageNumber: number, pageSize: number) => Promise<T[]>) {
    this.config = config;
    this.loader = loader;
  }

  async loadPage(pageNumber: number): Promise<T[]> {
    if (this.loadedPages.has(pageNumber)) {
      return this.loadedPages.get(pageNumber)!;
    }

    const data = await this.loader(pageNumber, this.config.pageSize);
    this.loadedPages.set(pageNumber, data);
    return data;
  }

  async loadRange(startPage: number, endPage: number): Promise<T[]> {
    const results: T[] = [];
    for (let page = startPage; page <= endPage; page++) {
      const pageData = await this.loadPage(page);
      results.push(...pageData);
    }
    return results;
  }

  getTotalPages(): number {
    return Math.ceil(this.config.totalItems / this.config.pageSize);
  }

  clearCache(): void {
    this.loadedPages.clear();
  }
}

/**
 * Query Result Caching
 */
export interface QueryCacheConfig {
  query: string;
  params?: Record<string, unknown>;
  ttl: number;
}

export class QueryCache {
  private cache: Map<string, { result: unknown; expiresAt: number }> = new Map();

  private generateKey(config: QueryCacheConfig): string {
    const paramStr = config.params ? JSON.stringify(config.params) : "";
    return `${config.query}:${paramStr}`;
  }

  set(config: QueryCacheConfig, result: unknown): void {
    const key = this.generateKey(config);
    const expiresAt = Date.now() + config.ttl * 1000;
    this.cache.set(key, { result, expiresAt });
  }

  get(config: QueryCacheConfig): unknown | null {
    const key = this.generateKey(config);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const queryCache = new QueryCache();

/**
 * Batch Processing
 * Process items in batches for better performance
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }

  return results;
}

/**
 * Debouncing for expensive operations
 */
export function debounce<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<unknown> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastPromise: Promise<unknown> | null = null;

  return async (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          lastPromise = fn(...args);
          const result = await lastPromise;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}

/**
 * Throttling for rate-limited operations
 */
export function throttle<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<unknown> {
  let lastCallTime = 0;
  let lastPromise: Promise<unknown> | null = null;

  return async (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delayMs) {
      lastCallTime = now;
      lastPromise = fn(...args);
      return lastPromise;
    }

    // Return the last promise if still pending
    if (lastPromise) {
      return lastPromise;
    }

    // Wait and retry
    await new Promise((resolve) =>
      setTimeout(resolve, delayMs - timeSinceLastCall)
    );
    lastCallTime = Date.now();
    lastPromise = fn(...args);
    return lastPromise;
  };
}

/**
 * Memory management
 */
export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentUsed: number;
}

export function getMemoryStats(): MemoryStats {
  const memUsage = process.memoryUsage();
  const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
  const external = Math.round(memUsage.external / 1024 / 1024);
  const rss = Math.round(memUsage.rss / 1024 / 1024);
  const percentUsed = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  return {
    heapUsed,
    heapTotal,
    external,
    rss,
    percentUsed,
  };
}

export function shouldGarbageCollect(): boolean {
  const stats = getMemoryStats();
  return stats.percentUsed > 85; // Trigger GC if heap usage > 85%
}

/**
 * Performance monitoring
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const performanceMetrics: PerformanceMetric[] = [];

export function recordPerformanceMetric(
  name: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  performanceMetrics.push({
    name,
    duration,
    timestamp: new Date(),
    metadata,
  });

  // Keep only last 1000 metrics
  if (performanceMetrics.length > 1000) {
    performanceMetrics.shift();
  }
}

export function getPerformanceMetrics(name?: string): PerformanceMetric[] {
  if (!name) return performanceMetrics;
  return performanceMetrics.filter((m) => m.name === name);
}

export function getPerformanceStats(name: string): {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
} {
  const metrics = getPerformanceMetrics(name);
  if (metrics.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p95Duration: 0,
    };
  }

  const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
  const avgDuration =
    durations.reduce((a, b) => a + b, 0) / durations.length;
  const p95Index = Math.floor(durations.length * 0.95);

  return {
    count: metrics.length,
    avgDuration: Math.round(avgDuration * 100) / 100,
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p95Duration: durations[p95Index],
  };
}

/**
 * Async operation tracking
 */
export class AsyncOperationTracker {
  private operations: Map<string, Promise<unknown>> = new Map();

  async track<T>(
    id: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const promise = operation();
    this.operations.set(id, promise);

    try {
      return await promise;
    } finally {
      this.operations.delete(id);
    }
  }

  getPendingOperations(): string[] {
    return Array.from(this.operations.keys());
  }

  getPendingCount(): number {
    return this.operations.size;
  }

  async waitForAll(): Promise<void> {
    await Promise.all(this.operations.values());
  }
}

export const operationTracker = new AsyncOperationTracker();
