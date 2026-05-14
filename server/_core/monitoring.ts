/**
 * Monitoring & Analytics
 * Tracks system health, API performance, and user engagement
 */

/**
 * API Performance Metrics
 */
export interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: number;
  error?: string;
}

const apiMetrics: ApiMetric[] = [];

export function recordApiMetric(metric: Omit<ApiMetric, "timestamp">): void {
  apiMetrics.push({
    ...metric,
    timestamp: new Date(),
  });

  // Keep only last 10000 metrics
  if (apiMetrics.length > 10000) {
    apiMetrics.shift();
  }
}

export function getApiMetrics(
  endpoint?: string,
  method?: string,
  limit: number = 100
): ApiMetric[] {
  let filtered = apiMetrics;

  if (endpoint) {
    filtered = filtered.filter((m) => m.endpoint === endpoint);
  }

  if (method) {
    filtered = filtered.filter((m) => m.method === method);
  }

  return filtered.slice(-limit);
}

export function getApiStats(endpoint?: string): {
  totalRequests: number;
  avgDuration: number;
  errorRate: number;
  successRate: number;
  p95Duration: number;
  p99Duration: number;
} {
  let metrics = apiMetrics;

  if (endpoint) {
    metrics = metrics.filter((m) => m.endpoint === endpoint);
  }

  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      avgDuration: 0,
      errorRate: 0,
      successRate: 0,
      p95Duration: 0,
      p99Duration: 0,
    };
  }

  const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
  const errors = metrics.filter((m) => m.statusCode >= 400).length;

  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  return {
    totalRequests: metrics.length,
    avgDuration: Math.round(
      (durations.reduce((a, b) => a + b, 0) / durations.length) * 100
    ) / 100,
    errorRate: Math.round((errors / metrics.length) * 100 * 100) / 100,
    successRate: Math.round(((metrics.length - errors) / metrics.length) * 100 * 100) / 100,
    p95Duration: durations[p95Index] || 0,
    p99Duration: durations[p99Index] || 0,
  };
}

/**
 * Generation Success Tracking
 */
export interface GenerationMetric {
  type: "lyrics" | "image" | "video" | "metadata";
  provider: string;
  success: boolean;
  duration: number;
  cost: number;
  timestamp: Date;
  userId?: number;
  projectId?: number;
  error?: string;
}

const generationMetrics: GenerationMetric[] = [];

export function recordGenerationMetric(metric: Omit<GenerationMetric, "timestamp">): void {
  generationMetrics.push({
    ...metric,
    timestamp: new Date(),
  });

  // Keep only last 5000 metrics
  if (generationMetrics.length > 5000) {
    generationMetrics.shift();
  }
}

export function getGenerationStats(type?: "lyrics" | "image" | "video" | "metadata"): {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  avgCost: number;
  byProvider: Record<string, { success: number; failure: number; successRate: number }>;
} {
  let metrics = generationMetrics;

  if (type) {
    metrics = metrics.filter((m) => m.type === type);
  }

  if (metrics.length === 0) {
    return {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      avgDuration: 0,
      totalCost: 0,
      avgCost: 0,
      byProvider: {},
    };
  }

  const successCount = metrics.filter((m) => m.success).length;
  const failureCount = metrics.length - successCount;
  const avgDuration =
    metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);

  // Group by provider
  const byProvider: Record<string, { success: number; failure: number; successRate: number }> = {};
  for (const metric of metrics) {
    if (!byProvider[metric.provider]) {
      byProvider[metric.provider] = { success: 0, failure: 0, successRate: 0 };
    }
    if (metric.success) {
      byProvider[metric.provider].success++;
    } else {
      byProvider[metric.provider].failure++;
    }
  }

  // Calculate success rates
  for (const provider of Object.keys(byProvider)) {
    const total = byProvider[provider].success + byProvider[provider].failure;
    byProvider[provider].successRate = Math.round(
      (byProvider[provider].success / total) * 100 * 100
    ) / 100;
  }

  return {
    totalAttempts: metrics.length,
    successCount,
    failureCount,
    successRate: Math.round((successCount / metrics.length) * 100 * 100) / 100,
    avgDuration: Math.round(avgDuration * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    avgCost: Math.round((totalCost / metrics.length) * 100) / 100,
    byProvider,
  };
}

/**
 * User Engagement Tracking
 */
export interface UserEngagementMetric {
  userId: number;
  action: string;
  projectId?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const engagementMetrics: UserEngagementMetric[] = [];

export function recordUserEngagement(metric: Omit<UserEngagementMetric, "timestamp">): void {
  engagementMetrics.push({
    ...metric,
    timestamp: new Date(),
  });

  // Keep only last 50000 metrics
  if (engagementMetrics.length > 50000) {
    engagementMetrics.shift();
  }
}

export function getUserEngagementStats(userId: number): {
  totalActions: number;
  uniqueProjects: number;
  lastActive: Date | null;
  actionBreakdown: Record<string, number>;
} {
  const userMetrics = engagementMetrics.filter((m) => m.userId === userId);

  if (userMetrics.length === 0) {
    return {
      totalActions: 0,
      uniqueProjects: 0,
      lastActive: null,
      actionBreakdown: {},
    };
  }

  const projectIds = new Set(userMetrics.map((m) => m.projectId).filter(Boolean));
  const actionBreakdown: Record<string, number> = {};

  for (const metric of userMetrics) {
    actionBreakdown[metric.action] = (actionBreakdown[metric.action] || 0) + 1;
  }

  return {
    totalActions: userMetrics.length,
    uniqueProjects: projectIds.size,
    lastActive: userMetrics[userMetrics.length - 1].timestamp,
    actionBreakdown,
  };
}

/**
 * System Health Monitoring
 */
export interface SystemHealthMetric {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  pendingOperations: number;
  errorRate: number;
  responseTime: number;
}

const healthMetrics: SystemHealthMetric[] = [];

export function recordSystemHealth(metric: Omit<SystemHealthMetric, "timestamp">): void {
  healthMetrics.push({
    ...metric,
    timestamp: new Date(),
  });

  // Keep only last 1440 metrics (24 hours at 1-minute intervals)
  if (healthMetrics.length > 1440) {
    healthMetrics.shift();
  }
}

export function getSystemHealthStatus(): {
  healthy: boolean;
  status: "good" | "warning" | "critical";
  metrics: SystemHealthMetric | null;
  issues: string[];
} {
  if (healthMetrics.length === 0) {
    return {
      healthy: true,
      status: "good",
      metrics: null,
      issues: [],
    };
  }

  const latest = healthMetrics[healthMetrics.length - 1];
  const issues: string[] = [];

  if (latest.memoryUsage > 85) {
    issues.push("High memory usage");
  }

  if (latest.errorRate > 5) {
    issues.push("High error rate");
  }

  if (latest.responseTime > 5000) {
    issues.push("Slow response times");
  }

  if (latest.activeConnections > 1000) {
    issues.push("High number of active connections");
  }

  let status: "good" | "warning" | "critical" = "good";
  if (issues.length > 0) {
    status = issues.length > 2 ? "critical" : "warning";
  }

  return {
    healthy: issues.length === 0,
    status,
    metrics: latest,
    issues,
  };
}

/**
 * Cost Tracking by Provider
 */
export interface CostMetric {
  provider: string;
  type: string;
  cost: number;
  timestamp: Date;
  userId?: number;
}

const costMetrics: CostMetric[] = [];

export function recordCostMetric(metric: Omit<CostMetric, "timestamp">): void {
  costMetrics.push({
    ...metric,
    timestamp: new Date(),
  });
}

export function getCostStats(provider?: string, type?: string): {
  totalCost: number;
  byProvider: Record<string, number>;
  byType: Record<string, number>;
  dailyCosts: Record<string, number>;
} {
  let metrics = costMetrics;

  if (provider) {
    metrics = metrics.filter((m) => m.provider === provider);
  }

  if (type) {
    metrics = metrics.filter((m) => m.type === type);
  }

  const byProvider: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const dailyCosts: Record<string, number> = {};

  for (const metric of metrics) {
    byProvider[metric.provider] = (byProvider[metric.provider] || 0) + metric.cost;
    byType[metric.type] = (byType[metric.type] || 0) + metric.cost;

    const date = metric.timestamp.toISOString().split("T")[0];
    dailyCosts[date] = (dailyCosts[date] || 0) + metric.cost;
  }

  const totalCost = Object.values(byProvider).reduce((a, b) => a + b, 0);

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    byProvider: Object.fromEntries(
      Object.entries(byProvider).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
    dailyCosts: Object.fromEntries(
      Object.entries(dailyCosts).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
  };
}

/**
 * Dashboard Summary
 */
export function getDashboardSummary(): {
  apiStats: ReturnType<typeof getApiStats>;
  generationStats: ReturnType<typeof getGenerationStats>;
  systemHealth: ReturnType<typeof getSystemHealthStatus>;
  costStats: ReturnType<typeof getCostStats>;
} {
  return {
    apiStats: getApiStats(),
    generationStats: getGenerationStats(),
    systemHealth: getSystemHealthStatus(),
    costStats: getCostStats(),
  };
}
