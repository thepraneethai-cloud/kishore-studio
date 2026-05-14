/**
 * Security Enhancements
 * Implements API key encryption, audit logging, and rate limiting
 */

import crypto from "crypto";

/**
 * API Key Encryption/Decryption
 * Encrypts sensitive API keys at rest
 */
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");

export interface EncryptedSecret {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encryptApiKey(apiKey: string): EncryptedSecret {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptApiKey(secret: EncryptedSecret): string {
  try {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      Buffer.from(secret.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(secret.authTag, "hex"));

    let decrypted = decipher.update(secret.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Failed to decrypt API key");
  }
}

/**
 * Audit Logging
 * Tracks all sensitive operations and API key access
 */
export enum AuditAction {
  API_KEY_CREATED = "API_KEY_CREATED",
  API_KEY_ACCESSED = "API_KEY_ACCESSED",
  API_KEY_ROTATED = "API_KEY_ROTATED",
  API_KEY_DELETED = "API_KEY_DELETED",
  API_KEY_EXPORTED = "API_KEY_EXPORTED",
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  PERMISSION_CHANGED = "PERMISSION_CHANGED",
  DATA_EXPORTED = "DATA_EXPORTED",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
}

export interface AuditLog {
  id: string;
  userId: number;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "FAILURE";
  reason?: string;
  timestamp: Date;
}

const auditLogs: AuditLog[] = [];

export function logAuditEvent(event: Omit<AuditLog, "id" | "timestamp">): void {
  const auditEntry: AuditLog = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };

  auditLogs.push(auditEntry);

  // Keep only last 10000 logs
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }

  // Log sensitive actions
  if (
    [
      AuditAction.API_KEY_CREATED,
      AuditAction.API_KEY_ROTATED,
      AuditAction.API_KEY_DELETED,
      AuditAction.PERMISSION_CHANGED,
    ].includes(event.action)
  ) {
    console.log(
      `[AUDIT] ${event.action} by user ${event.userId} on ${event.resourceType}/${event.resourceId}`
    );
  }
}

export function getAuditLogs(
  userId?: number,
  action?: AuditAction,
  limit: number = 100
): AuditLog[] {
  let filtered = auditLogs;

  if (userId) {
    filtered = filtered.filter((log) => log.userId === userId);
  }

  if (action) {
    filtered = filtered.filter((log) => log.action === action);
  }

  return filtered.slice(-limit);
}

/**
 * Rate Limiting
 * Prevents abuse by limiting requests per user/IP
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: { userId?: number; ip?: string }) => string;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(req: { userId?: number; ip?: string }): boolean {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(req)
      : req.userId?.toString() || req.ip || "unknown";

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request timestamps for this key
    let timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(key, timestamps);

    return true;
  }

  getRemainingRequests(req: { userId?: number; ip?: string }): number {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(req)
      : req.userId?.toString() || req.ip || "unknown";

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, this.config.maxRequests - validTimestamps.length);
  }

  reset(req: { userId?: number; ip?: string }): void {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(req)
      : req.userId?.toString() || req.ip || "unknown";

    this.requests.delete(key);
  }
}

/**
 * Global rate limiters for different operations
 */
export const rateLimiters = {
  // API calls: 100 per minute
  api: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),

  // Generation operations: 10 per minute
  generation: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
  }),

  // Image generation: 5 per hour
  imageGeneration: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  }),

  // Video generation: 2 per day
  videoGeneration: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000,
    maxRequests: 2,
  }),

  // Login attempts: 5 per 15 minutes
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),
};

/**
 * Input validation and sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .slice(0, 10000); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * CORS and security headers
 */
export const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

/**
 * Session security
 */
export interface SessionConfig {
  maxAge: number; // Session max age in milliseconds
  secure: boolean; // HTTPS only
  httpOnly: boolean; // No JavaScript access
  sameSite: "strict" | "lax" | "none";
}

export const SESSION_CONFIG: SessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Password security
 */
export function validatePasswordStrength(password: string): {
  strong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 20;
  else feedback.push("Password should be at least 8 characters");

  if (password.length >= 12) score += 10;

  if (/[a-z]/.test(password)) score += 20;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 20;
  else feedback.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score += 15;
  else feedback.push("Add numbers");

  if (/[!@#$%^&*]/.test(password)) score += 15;
  else feedback.push("Add special characters");

  return {
    strong: score >= 80,
    score,
    feedback,
  };
}

/**
 * API Key rotation
 */
export interface ApiKeyRotationPolicy {
  rotationIntervalDays: number;
  maxKeysPerUser: number;
  requireRotationAfterDays: number;
}

export const DEFAULT_KEY_ROTATION_POLICY: ApiKeyRotationPolicy = {
  rotationIntervalDays: 90,
  maxKeysPerUser: 5,
  requireRotationAfterDays: 180,
};

export function shouldRotateKey(createdAt: Date, policy: ApiKeyRotationPolicy): boolean {
  const daysSinceCreation = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceCreation >= policy.rotationIntervalDays;
}
