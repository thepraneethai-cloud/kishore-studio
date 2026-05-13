import {
  int,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table for storing video projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["devotional", "story", "mythology", "custom"]).notNull(),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"]).default("draft").notNull(),
  deity: varchar("deity", { length: 64 }),
  storyTitle: varchar("storyTitle", { length: 255 }),
  storyDescription: text("storyDescription"),
  lyrics: text("lyrics"),
  sunoStyle: json("sunoStyle"),
  audioUrl: text("audioUrl"),
  audioStorageKey: varchar("audioStorageKey", { length: 255 }),
  masterPrompt: text("masterPrompt"),
  masterPromptFeedback: text("masterPromptFeedback"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_projects_userId").on(table.userId),
]);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Background jobs table for tracking generation tasks
 */
export const jobs = mysqlTable("jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["lyrics", "image", "video", "scene_generation"]).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "succeeded", "failed", "cancelled"]).default("queued").notNull(),
  input: json("input").notNull(),
  output: json("output"),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_jobs_userId").on(table.userId),
  index("idx_jobs_projectId").on(table.projectId),
  index("idx_jobs_status").on(table.status),
]);

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * User settings for AI provider preferences and API keys
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  lyricsProvider: mysqlEnum("lyricsProvider", ["chatgpt", "claude", "gemini", "groq", "mistral"]).default("chatgpt"),
  imageProvider: mysqlEnum("imageProvider", ["flux", "dalle", "midjourney"]).default("flux"),
  videoProvider: mysqlEnum("videoProvider", ["runway", "grok", "pika"]).default("runway"),
  openaiApiKey: text("openaiApiKey"),
  claudeApiKey: text("claudeApiKey"),
  geminiApiKey: text("geminiApiKey"),
  replicateApiKey: text("replicateApiKey"),
  dallEApiKey: text("dallEApiKey"),
  midjourneyApiKey: text("midjourneyApiKey"),
  grokApiKey: text("grokApiKey"),
  pikaApiKey: text("pikaApiKey"),
  groqApiKey: text("groqApiKey"),
  mistralApiKey: text("mistralApiKey"),
  llmModel: text("llmModel"),
  monthlyBudgetUSD: decimal("monthlyBudgetUSD", { precision: 10, scale: 2 }).default("50.00"),
  budgetResetDay: int("budgetResetDay").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Cost tracking for usage analytics
 */
export const costTracking = mysqlTable("costTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["lyrics", "image", "video"]).notNull(),
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
  jobId: varchar("jobId", { length: 64 }),
  date: timestamp("date").defaultNow().notNull(),
}, (table) => [
  index("idx_costTracking_userId").on(table.userId),
]);

export type CostTracking = typeof costTracking.$inferSelect;
export type InsertCostTracking = typeof costTracking.$inferInsert;

/**
 * Scenes for story/mythology mode
 */
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneNumber: int("sceneNumber").notNull(),
  description: text("description").notNull(),
  imagePrompt: text("imagePrompt"),
  videoPrompt: text("videoPrompt"),
  imageJobId: varchar("imageJobId", { length: 64 }),
  videoJobId: varchar("videoJobId", { length: 64 }),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_scenes_projectId").on(table.projectId),
]);

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

/**
 * Prompt templates for lyrics generation
 */
export const promptTemplates = mysqlTable("promptTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  theme: varchar("theme", { length: 64 }).notNull(),
  prompt: text("prompt").notNull(),
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_promptTemplates_userId").on(table.userId),
]);

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;

/**
 * SUNO style templates for reuse
 */
export const sunoStyleTemplates = mysqlTable("sunoStyleTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  theme: varchar("theme", { length: 64 }).notNull(),
  tempo: varchar("tempo", { length: 64 }).notNull(),
  style: varchar("style", { length: 255 }).notNull(),
  mood: varchar("mood", { length: 255 }).notNull(),
  instruments: json("instruments").notNull(),
  vocals: varchar("vocals", { length: 255 }).notNull(),
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_sunoStyleTemplates_userId").on(table.userId),
]);

export type SunoStyleTemplate = typeof sunoStyleTemplates.$inferSelect;
export type InsertSunoStyleTemplate = typeof sunoStyleTemplates.$inferInsert;