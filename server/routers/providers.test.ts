// ============================================================
// DESIGN: Comprehensive Tests for Multi-AI Providers
// ============================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { providersRouter } from "./providers";
import { getDb, getUserSettings } from "../db";

// Mock dependencies
vi.mock("../db", () => ({
  getDb: vi.fn(),
  getUserSettings: vi.fn(),
}));

vi.mock("../_core/providers/chatgpt", () => ({
  generateLyricsWithChatGPT: vi.fn(),
}));

vi.mock("../_core/providers/claude", () => ({
  generateLyricsWithClaude: vi.fn(),
}));

vi.mock("../_core/providers/images", () => ({
  generateImagesWithFlux: vi.fn(),
  generateImagesWithDALLE: vi.fn(),
}));

describe("Providers Router", () => {
  const mockUser = { id: 1, role: "user" as const };
  const mockContext = { user: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateProviderSettings", () => {
    it("should update provider settings successfully", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.updateProviderSettings({
        lyricsProvider: "chatgpt",
        imageProvider: "dall-e",
        openaiApiKey: "sk-test-123",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Provider settings updated");
    });

    it("should handle database connection errors", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.updateProviderSettings({
        lyricsProvider: "chatgpt",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database connection failed");
    });
  });

  describe("getProviderSettings", () => {
    it("should return provider settings with configured status", async () => {
      const mockSettings = {
        lyricsProvider: "chatgpt",
        imageProvider: "flux",
        videoProvider: "runway",
        geminiApiKey: "test-key",
        openaiApiKey: "sk-test-123",
        claudeApiKey: null,
        replicateApiKey: "rep-test-123",
        dallEApiKey: null,
        grokApiKey: null,
        pikaApiKey: null,
      };

      vi.mocked(getUserSettings).mockResolvedValue(mockSettings as any);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.getProviderSettings();

      expect(result.success).toBe(true);
      expect(result.data?.lyricsProvider).toBe("chatgpt");
      expect(result.data?.providers.lyrics.chatgpt.configured).toBe(true);
      expect(result.data?.providers.lyrics.claude.configured).toBe(false);
    });

    it("should return default providers when none configured", async () => {
      vi.mocked(getUserSettings).mockResolvedValue(null);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.getProviderSettings();

      expect(result.success).toBe(true);
      expect(result.data?.lyricsProvider).toBe("gemini");
      expect(result.data?.imageProvider).toBe("flux");
    });
  });

  describe("generateLyricsWithProvider", () => {
    it("should generate lyrics with ChatGPT provider", async () => {
      const mockSettings = {
        openaiApiKey: "sk-test-123",
      };

      vi.mocked(getUserSettings).mockResolvedValue(mockSettings as any);

      const mockLyrics = {
        lyrics: "[Pallavi]\nTest lyrics",
        language: "telugu",
        wordCount: 50,
      };

      const { generateLyricsWithChatGPT } = await import("../_core/providers/chatgpt");
      vi.mocked(generateLyricsWithChatGPT).mockResolvedValue(mockLyrics);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.generateLyricsWithProvider({
        provider: "chatgpt",
        subject: "Ganesha",
        category: "devotional",
        mood: "joyful",
        duration: "3 min",
        languageStyle: "poetic",
      });

      expect(result.success).toBe(true);
      expect(result.data?.lyrics).toContain("Test lyrics");
    });

    it("should fail when provider API key not configured", async () => {
      vi.mocked(getUserSettings).mockResolvedValue({} as any);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.generateLyricsWithProvider({
        provider: "chatgpt",
        subject: "Ganesha",
        category: "devotional",
        mood: "joyful",
        duration: "3 min",
        languageStyle: "poetic",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("API key not configured");
    });

    it("should generate lyrics with Claude provider", async () => {
      const mockSettings = {
        claudeApiKey: "claude-test-key",
      };

      vi.mocked(getUserSettings).mockResolvedValue(mockSettings as any);

      const mockLyrics = {
        lyrics: "[Pallavi]\nClaude lyrics",
        language: "telugu",
        wordCount: 60,
      };

      const { generateLyricsWithClaude } = await import("../_core/providers/claude");
      vi.mocked(generateLyricsWithClaude).mockResolvedValue(mockLyrics);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.generateLyricsWithProvider({
        provider: "claude",
        subject: "Krishna",
        category: "devotional",
        mood: "meditative",
        duration: "4 min",
        languageStyle: "poetic",
      });

      expect(result.success).toBe(true);
      expect(result.data?.lyrics).toContain("Claude lyrics");
    });
  });

  describe("generateImagesWithProvider", () => {
    it("should generate images with Flux provider", async () => {
      const mockSettings = {
        replicateApiKey: "rep-test-key",
      };

      vi.mocked(getUserSettings).mockResolvedValue(mockSettings as any);

      const mockImages = {
        urls: ["https://example.com/image1.png"],
        provider: "flux",
      };

      const { generateImagesWithFlux } = await import("../_core/providers/images");
      vi.mocked(generateImagesWithFlux).mockResolvedValue(mockImages);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.generateImagesWithProvider({
        provider: "flux",
        prompt: "A beautiful temple scene",
        count: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data?.urls).toHaveLength(1);
      expect(result.data?.provider).toBe("flux");
    });

    it("should generate images with DALL-E provider", async () => {
      const mockSettings = {
        dallEApiKey: "dalle-test-key",
      };

      vi.mocked(getUserSettings).mockResolvedValue(mockSettings as any);

      const mockImages = {
        urls: ["https://example.com/dalle1.png", "https://example.com/dalle2.png"],
        provider: "dall-e",
      };

      const { generateImagesWithDALLE } = await import("../_core/providers/images");
      vi.mocked(generateImagesWithDALLE).mockResolvedValue(mockImages);

      const caller = providersRouter.createCaller(mockContext as any);
      const result = await caller.generateImagesWithProvider({
        provider: "dall-e",
        prompt: "A divine celestial scene",
        count: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data?.urls).toHaveLength(2);
      expect(result.data?.provider).toBe("dall-e");
    });
  });
});
