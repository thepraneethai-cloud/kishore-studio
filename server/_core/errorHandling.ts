/**
 * Enhanced Error Handling & Resilience
 * Implements exponential backoff, circuit breaker pattern, and graceful degradation
 */

/**
 * Exponential backoff retry strategy
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = finalConfig.initialDelayMs;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === finalConfig.maxRetries) {
        throw new Error(
          `Failed after ${finalConfig.maxRetries} retries: ${lastError.message}`
        );
      }

      // Calculate delay with optional jitter
      let waitTime = delay;
      if (finalConfig.jitter) {
        waitTime = delay * (0.5 + Math.random());
      }

      console.warn(
        `Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${Math.round(waitTime)}ms. Error: ${lastError.message}`
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      delay = Math.min(
        delay * finalConfig.backoffMultiplier,
        finalConfig.maxDelayMs
      );
    }
  }

  throw lastError || new Error("Unknown error during retry");
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests to failing services
 */
export enum CircuitBreakerState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, reject requests
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close after half-open
  timeout: number; // Timeout in ms before attempting to recover
}

export class CircuitBreaker<T> {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000, // 1 minute
    };
  }

  async execute<R>(fn: () => Promise<R>): Promise<R> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.config.timeout
      ) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(
          `Circuit breaker is OPEN. Service unavailable. Retry after ${this.config.timeout}ms`
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.state = CircuitBreakerState.CLOSED;
          this.failureCount = 0;
          this.successCount = 0;
          console.log("Circuit breaker CLOSED - service recovered");
        }
      } else if (this.state === CircuitBreakerState.CLOSED) {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        console.error(
          `Circuit breaker OPEN - threshold reached (${this.failureCount} failures)`
        );
      }

      throw error;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Provider-specific circuit breakers
 */
export const providerCircuitBreakers: Record<string, CircuitBreaker<unknown>> = {
  gemini: new CircuitBreaker({ failureThreshold: 5, timeout: 60000 }),
  chatgpt: new CircuitBreaker({ failureThreshold: 5, timeout: 60000 }),
  claude: new CircuitBreaker({ failureThreshold: 5, timeout: 60000 }),
  flux: new CircuitBreaker({ failureThreshold: 3, timeout: 120000 }),
  "dall-e": new CircuitBreaker({ failureThreshold: 3, timeout: 120000 }),
  runway: new CircuitBreaker({ failureThreshold: 2, timeout: 180000 }),
};

/**
 * Error classification and handling
 */
export enum ErrorSeverity {
  LOW = "LOW", // Can be retried safely
  MEDIUM = "MEDIUM", // May need user intervention
  HIGH = "HIGH", // Critical, needs immediate attention
}

export interface ClassifiedError {
  severity: ErrorSeverity;
  retryable: boolean;
  fallbackAvailable: boolean;
  message: string;
  originalError: Error;
}

export function classifyError(error: unknown): ClassifiedError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  // Network errors - retryable
  if (
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("timeout") ||
    message.includes("network")
  ) {
    return {
      severity: ErrorSeverity.LOW,
      retryable: true,
      fallbackAvailable: true,
      message: "Network error - retrying with exponential backoff",
      originalError: err,
    };
  }

  // Rate limiting - retryable with longer delay
  if (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("quota")
  ) {
    return {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      fallbackAvailable: true,
      message: "Rate limited - will retry with longer delay",
      originalError: err,
    };
  }

  // Authentication errors - not retryable
  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return {
      severity: ErrorSeverity.HIGH,
      retryable: false,
      fallbackAvailable: false,
      message: "Authentication error - check API credentials",
      originalError: err,
    };
  }

  // Validation errors - not retryable
  if (
    message.includes("400") ||
    message.includes("validation") ||
    message.includes("invalid")
  ) {
    return {
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      fallbackAvailable: true,
      message: "Validation error - check input parameters",
      originalError: err,
    };
  }

  // Server errors - retryable
  if (message.includes("500") || message.includes("server error")) {
    return {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      fallbackAvailable: true,
      message: "Server error - retrying",
      originalError: err,
    };
  }

  // Unknown errors - assume retryable with caution
  return {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    fallbackAvailable: true,
    message: "Unknown error - may retry",
    originalError: err,
  };
}

/**
 * Graceful degradation - provide fallback responses
 */
export interface FallbackResponse<T> {
  data: T;
  isFromFallback: boolean;
  reason: string;
}

export function createFallbackResponse<T>(
  data: T,
  reason: string
): FallbackResponse<T> {
  return {
    data,
    isFromFallback: true,
    reason,
  };
}

/**
 * Error recovery procedures
 */
export async function recoverFromProviderFailure(
  provider: string,
  fallbackProvider: string,
  operation: () => Promise<unknown>
): Promise<{ success: boolean; provider: string; error?: string }> {
  try {
    // Try primary provider
    const breaker = providerCircuitBreakers[provider];
    if (breaker) {
      await breaker.execute(operation);
      return { success: true, provider };
    }

    // Fallback to secondary provider
    const fallbackBreaker = providerCircuitBreakers[fallbackProvider];
    if (fallbackBreaker) {
      await fallbackBreaker.execute(operation);
      return { success: true, provider: fallbackProvider };
    }

    return {
      success: false,
      provider: "none",
      error: "No available providers",
    };
  } catch (error) {
    return {
      success: false,
      provider: "none",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Error logging with context
 */
export interface ErrorContext {
  userId?: number;
  projectId?: number;
  operation: string;
  timestamp: Date;
  severity: ErrorSeverity;
  retryable: boolean;
  metadata?: Record<string, unknown>;
}

const errorLog: ErrorContext[] = [];

export function logError(
  error: ClassifiedError,
  context: Omit<ErrorContext, "severity" | "retryable" | "timestamp">
): void {
  const errorContext: ErrorContext = {
    ...context,
    severity: error.severity,
    retryable: error.retryable,
    timestamp: new Date(),
  };

  errorLog.push(errorContext);

  // Keep only last 1000 errors
  if (errorLog.length > 1000) {
    errorLog.shift();
  }

  // Log to console with appropriate level
  const logFn =
    error.severity === ErrorSeverity.HIGH ? console.error : console.warn;
  logFn(
    `[${error.severity}] ${context.operation}: ${error.message}`,
    errorContext
  );
}

export function getErrorLog(
  filter?: Partial<ErrorContext>
): ErrorContext[] {
  if (!filter) return errorLog;

  return errorLog.filter((entry) => {
    if (filter.userId && entry.userId !== filter.userId) return false;
    if (filter.projectId && entry.projectId !== filter.projectId) return false;
    if (filter.operation && entry.operation !== filter.operation) return false;
    if (filter.severity && entry.severity !== filter.severity) return false;
    return true;
  });
}

/**
 * Health check for all circuit breakers
 */
export function getCircuitBreakerHealth(): Record<
  string,
  { state: CircuitBreakerState; healthy: boolean }
> {
  const health: Record<string, { state: CircuitBreakerState; healthy: boolean }> =
    {};

  for (const [provider, breaker] of Object.entries(providerCircuitBreakers)) {
    const state = breaker.getState();
    health[provider] = {
      state,
      healthy: state !== CircuitBreakerState.OPEN,
    };
  }

  return health;
}

/**
 * Reset all circuit breakers (use with caution)
 */
export function resetAllCircuitBreakers(): void {
  for (const breaker of Object.values(providerCircuitBreakers)) {
    breaker.reset();
  }
  console.log("All circuit breakers reset");
}
