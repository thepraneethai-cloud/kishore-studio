/**
 * Best Practices Implementation Module
 * Integrates all 7 best practices into the application:
 * 1. Telugu SEO Keywords & Metadata Optimization
 * 2. Database Optimization (Caching, Query Optimization)
 * 3. Enhanced Error Handling & Resilience (Retry Logic, Circuit Breaker)
 * 4. Security Enhancements (API Key Encryption, Audit Logging, Rate Limiting)
 * 5. Performance Optimization (Caching, Progressive Generation, Lazy Loading)
 * 6. Monitoring & Analytics (API Metrics, Generation Stats, System Health)
 * 7. UX Enhancements (Undo/Redo, Version History, Batch Operations)
 */

import { LRUCache } from 'lru-cache';

// ============================================================================
// PHASE 1: Telugu SEO Keywords & Metadata Optimization
// ============================================================================

export const TELUGU_SEO_KEYWORDS = {
  deities: {
    krishna: ['కృష్ణ', 'కన్నయ్య', 'గోపాల', 'మోహన్', 'శ్రీకృష్ణ'],
    shiva: ['శివ', 'మహేశ్వర', 'శంభూ', 'నీలకంఠ', 'పరమేశ్వర'],
    hanuman: ['హనుమాన్', 'బాలాజీ', 'మారుతి', 'అంజనీపుత్ర'],
    durga: ['దుర్గ', 'దేవీ', 'పార్వతీ', 'కాళీ', 'చండీ'],
    rama: ['రామ', 'రాఘవ', 'రాజీవ్', 'దశరథ్', 'సీతారామ'],
    ganesha: ['గణేష', 'విఘ్నేశ్వర', 'ఎకదంత', 'లంబోదర'],
  },
  devotional: ['భక్తి', 'ఆరతి', 'మంత్రం', 'స్తోత్రం', 'సంకీర్తన', 'భజన'],
  emotions: ['ప్రేమ', 'శాంతి', 'ఆనందం', 'భయం', 'ఆశ్చర్యం', 'కృపా'],
  seasons: ['వసంత', 'గ్రీష్మ', 'శరద్', 'హేమంత', 'శీత'],
};

export function generateSeoMetadata(subject: string, category: string, mood: string): {
  keywords: string[];
  tags: string[];
  seoScore: number;
} {
  const keywords: string[] = [];
  const tags: string[] = [];

  // Add deity-specific keywords
  Object.entries(TELUGU_SEO_KEYWORDS.deities).forEach(([deity, keywords_list]) => {
    if (subject.toLowerCase().includes(deity)) {
      keywords.push(...keywords_list);
      tags.push(deity);
    }
  });

  // Add category keywords
  keywords.push(...TELUGU_SEO_KEYWORDS.devotional);
  tags.push(category);

  // Add mood keywords
  keywords.push(...TELUGU_SEO_KEYWORDS.emotions);
  tags.push(mood);

  // Calculate SEO score (0-100)
  const seoScore = Math.min(100, keywords.length * 5 + tags.length * 3);

  return { keywords, tags, seoScore };
}

// ============================================================================
// PHASE 2: Database Optimization (Caching, Query Optimization)
// ============================================================================

const queryCache = new LRUCache<string, any>({
  max: 500,
  maxSize: 5000000, // 5MB
  ttl: 1000 * 60 * 5, // 5 minutes
  sizeCalculation: (item: any) => JSON.stringify(item).length,
});

export function getCachedQuery<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
  const cached = queryCache.get(key);
  if (cached) return Promise.resolve(cached);

  return fetcher().then((result) => {
    queryCache.set(key, result, { ttl });
    return result;
  });
}

export function invalidateCache(pattern: string): void {
  for (const key of Array.from(queryCache.keys())) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
}

export function clearCache(): void {
  queryCache.clear();
}

// ============================================================================
// PHASE 3: Enhanced Error Handling & Resilience
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================================================
// PHASE 4: Security Enhancements
// ============================================================================

export function encryptApiKey(apiKey: string, encryptionKey: string): string {
  // Simple XOR encryption for demo (use proper encryption in production)
  return Buffer.from(apiKey)
    .toString('base64')
    .split('')
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ encryptionKey.charCodeAt(i % encryptionKey.length)))
    .join('');
}

export function decryptApiKey(encryptedKey: string, encryptionKey: string): string {
  return Buffer.from(
    encryptedKey
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ encryptionKey.charCodeAt(i % encryptionKey.length)))
      .join('')
  ).toString('base64');
}

export interface AuditLog {
  timestamp: Date;
  action: string;
  userId: string;
  resourceId: string;
  details: Record<string, any>;
}

const auditLogs: AuditLog[] = [];

export function logAuditEvent(log: AuditLog): void {
  auditLogs.push(log);
  // In production, persist to database
}

export function getAuditLogs(userId?: string, limit = 100): AuditLog[] {
  let logs = auditLogs;
  if (userId) {
    logs = logs.filter((log) => log.userId === userId);
  }
  return logs.slice(-limit);
}

export const rateLimiterConfig = {
  perUser: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  perIp: { maxRequests: 1000, windowMs: 60000 }, // 1000 requests per minute
  perProvider: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute per provider
};

// ============================================================================
// PHASE 5: Performance Optimization
// ============================================================================

export const responseCache = new LRUCache<string, any>({
  max: 1000,
  maxSize: 10000000, // 10MB
  ttl: 1000 * 60 * 10, // 10 minutes
  sizeCalculation: (item: any) => JSON.stringify(item).length,
});

export async function cacheResponse<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
  const cached = responseCache.get(key);
  if (cached) return cached;

  const result = await fn();
  responseCache.set(key, result, { ttl });
  return result;
}

export interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
}

export class ProgressiveGenerator {
  private updates: ProgressUpdate[] = [];

  addUpdate(stage: string, progress: number, message: string): void {
    this.updates.push({
      stage,
      progress,
      message,
      timestamp: new Date(),
    });
  }

  getUpdates(): ProgressUpdate[] {
    return this.updates;
  }

  clear(): void {
    this.updates = [];
  }
}

// ============================================================================
// PHASE 6: Monitoring & Analytics
// ============================================================================

export interface ApiMetric {
  provider: string;
  type: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  cost?: number;
}

export interface SystemHealth {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
}

const metrics: ApiMetric[] = [];
const healthHistory: SystemHealth[] = [];

export function recordMetric(metric: ApiMetric): void {
  metrics.push(metric);
  // Keep only last 10000 metrics
  if (metrics.length > 10000) {
    metrics.shift();
  }
}

export function getMetrics(provider?: string, hours = 24): ApiMetric[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  let result = metrics.filter((m) => m.timestamp.getTime() > cutoff);
  if (provider) {
    result = result.filter((m) => m.provider === provider);
  }
  return result;
}

export function recordSystemHealth(health: SystemHealth): void {
  healthHistory.push(health);
  if (healthHistory.length > 1000) {
    healthHistory.shift();
  }
}

export function getSystemHealth(hours = 1): SystemHealth[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return healthHistory.filter((h) => h.timestamp.getTime() > cutoff);
}

export function getAnalyticsSummary() {
  const recentMetrics = getMetrics(undefined, 24);
  const successRate = recentMetrics.length > 0 ? (recentMetrics.filter((m) => m.success).length / recentMetrics.length) * 100 : 0;
  const totalCost = recentMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
  const avgDuration = recentMetrics.length > 0 ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length : 0;

  return {
    successRate: successRate.toFixed(2),
    totalCost: totalCost.toFixed(2),
    avgDuration: avgDuration.toFixed(0),
    totalRequests: recentMetrics.length,
  };
}

// ============================================================================
// PHASE 7: UX Enhancements (Undo/Redo, Version History)
// ============================================================================

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export class UndoRedoStack {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize = 50;

  push(entry: HistoryEntry): void {
    this.undoStack.push(entry);
    this.redoStack = []; // Clear redo stack on new action
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (entry) {
      this.redoStack.push(entry);
    }
    return entry || null;
  }

  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (entry) {
      this.undoStack.push(entry);
    }
    return entry || null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistory(): HistoryEntry[] {
    return [...this.undoStack];
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export interface VersionSnapshot {
  id: string;
  projectId: string;
  timestamp: Date;
  label: string;
  data: Record<string, any>;
  author: string;
}

export class VersionHistory {
  private versions: VersionSnapshot[] = [];
  private maxVersions = 20;

  addVersion(version: VersionSnapshot): void {
    this.versions.push(version);
    if (this.versions.length > this.maxVersions) {
      this.versions.shift();
    }
  }

  getVersions(projectId: string): VersionSnapshot[] {
    return this.versions.filter((v) => v.projectId === projectId);
  }

  getVersion(id: string): VersionSnapshot | undefined {
    return this.versions.find((v) => v.id === id);
  }

  deleteVersion(id: string): void {
    const index = this.versions.findIndex((v) => v.id === id);
    if (index !== -1) {
      this.versions.splice(index, 1);
    }
  }

  compareVersions(id1: string, id2: string): { added: string[]; removed: string[]; changed: string[] } {
    const v1 = this.getVersion(id1);
    const v2 = this.getVersion(id2);

    if (!v1 || !v2) {
      return { added: [], removed: [], changed: [] };
    }

    const keys1 = Object.keys(v1.data);
    const keys2 = Object.keys(v2.data);

    const added = keys2.filter((k) => !keys1.includes(k));
    const removed = keys1.filter((k) => !keys2.includes(k));
    const changed = keys1.filter((k) => keys2.includes(k) && v1.data[k] !== v2.data[k]);

    return { added, removed, changed };
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchOperation {
  id: string;
  type: string;
  items: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Record<string, any>;
  error?: string;
}

export class BatchProcessor {
  private operations: BatchOperation[] = [];

  createBatch(type: string, items: string[]): BatchOperation {
    const operation: BatchOperation = {
      id: `batch_${Date.now()}`,
      type,
      items,
      status: 'pending',
    };
    this.operations.push(operation);
    return operation;
  }

  getBatch(id: string): BatchOperation | undefined {
    return this.operations.find((op) => op.id === id);
  }

  updateBatchStatus(id: string, status: BatchOperation['status'], results?: Record<string, any>, error?: string): void {
    const batch = this.getBatch(id);
    if (batch) {
      batch.status = status;
      if (results) batch.results = results;
      if (error) batch.error = error;
    }
  }

  getAllBatches(): BatchOperation[] {
    return this.operations;
  }

  clearOldBatches(olderThanHours = 24): void {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    this.operations = this.operations.filter((op) => {
      const opTime = parseInt(op.id.split('_')[1]);
      return opTime > cutoff;
    });
  }
}

export default {
  // Phase 1
  generateSeoMetadata,
  TELUGU_SEO_KEYWORDS,

  // Phase 2
  getCachedQuery,
  invalidateCache,
  clearCache,

  // Phase 3
  CircuitBreaker,
  retryWithBackoff,

  // Phase 4
  encryptApiKey,
  decryptApiKey,
  logAuditEvent,
  getAuditLogs,
  rateLimiterConfig,

  // Phase 5
  cacheResponse,
  ProgressiveGenerator,

  // Phase 6
  recordMetric,
  getMetrics,
  recordSystemHealth,
  getSystemHealth,
  getAnalyticsSummary,

  // Phase 7
  UndoRedoStack,
  VersionHistory,
  BatchProcessor,
};
