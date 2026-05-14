// ============================================================
// DESIGN: Comprehensive Tests for Story/Mythology Mode
// ============================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { storiesRouter } from "./stories";
import { getDb, getUserSettings } from "../db";
import { invokeLLM } from "../_core/llm";

// Mock dependencies
vi.mock("../db", () => ({
  getDb: vi.fn(),
  getUserSettings: vi.fn(),
}));

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("Stories Router", () => {
  const mockUser = { id: 1, role: "user" as const };
  const mockContext = { user: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStoryProject", () => {
    it("should create a story project successfully", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ id: 123 }]),
              }),
            }),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.createStoryProject({
        storyTitle: "The Ramayana",
        storyDescription: "The epic tale of Lord Rama",
        storyType: "story",
      });

      expect(result.success).toBe(true);
      expect(result.projectId).toBe(123);
      expect(result.message).toContain("Story project created");
    });

    it("should validate story title length", async () => {
      const caller = storiesRouter.createCaller(mockContext as any);

      await expect(caller.createStoryProject({
        storyTitle: "ab", // Too short
        storyDescription: "A valid description",
        storyType: "story",
      })).rejects.toThrow("Too small");
    });
  });

  describe("generateScenesFromStory", () => {
    it("should generate scenes from story description", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(getUserSettings).mockResolvedValue({ geminiApiKey: "test-key" } as any);

      const mockLLMResponse = {
        choices: [
          {
            message: {
              content: `
---
SCENE 1: The Exile Begins
Description: Rama and Sita leave Ayodhya
Image Prompt: A royal couple leaving a palace at dawn
Video Prompt: Slow pan across palace walls, figures walking away
---
SCENE 2: The Forest Journey
Description: Rama, Sita, and Lakshman in the forest
Image Prompt: Three figures in a dense forest with ancient trees
Video Prompt: Camera follows through forest, sunlight filtering through leaves
---
              `,
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.generateScenesFromStory({
        projectId: 1,
        storyDescription: "The story of Rama's exile",
        storyType: "story",
        sceneCount: 3,
      });

      expect(result.success).toBe(true);
      expect(result.sceneCount).toBeGreaterThan(0);
      expect(result.scenes).toBeDefined();
    });

    it("should handle scene count limits", async () => {
      const caller = storiesRouter.createCaller(mockContext as any);

      await expect(caller.generateScenesFromStory({
        projectId: 1,
        storyDescription: "Test story",
        storyType: "story",
        sceneCount: 25, // Too many
      })).rejects.toThrow("Too big");
    });

    it("should use user's LLM model if provided", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(getUserSettings).mockResolvedValue({ geminiApiKey: "test-key" } as any);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: "---\nSCENE 1: Test\nDescription: Test\nImage Prompt: Test\nVideo Prompt: Test\n---" } }],
      } as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      await caller.generateScenesFromStory({
        projectId: 1,
        storyDescription: "Test",
        storyType: "story",
        sceneCount: 3,
        llmModel: "gpt-4",
      });

      expect(invokeLLM).toHaveBeenCalled();
    });
  });

  describe("getStoryScenes", () => {
    it("should retrieve story scenes", async () => {
      const mockScenes = [
        {
          id: 1,
          projectId: 1,
          sceneNumber: 1,
          description: "Scene 1",
          imagePrompt: "Image for scene 1",
          videoPrompt: "Video for scene 1",
        },
        {
          id: 2,
          projectId: 1,
          sceneNumber: 2,
          description: "Scene 2",
          imagePrompt: "Image for scene 2",
          videoPrompt: "Video for scene 2",
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockScenes),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.getStoryScenes({ projectId: 1 });

      expect(result.success).toBe(true);
      expect(result.scenes).toHaveLength(2);
      expect(result.scenes?.[0].sceneNumber).toBe(1);
    });

    it("should handle empty scene list", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.getStoryScenes({ projectId: 999 });

      expect(result.success).toBe(true);
      expect(result.scenes).toHaveLength(0);
    });
  });

  describe("updateScene", () => {
    it("should update scene successfully", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.updateScene({
        sceneId: 1,
        description: "Updated description",
        imagePrompt: "Updated image prompt",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Scene updated");
    });

    it("should handle partial updates", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.updateScene({
        sceneId: 1,
        description: "Only update description",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Scene Parsing", () => {
    it("should parse scenes from LLM response", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(getUserSettings).mockResolvedValue({} as any);

      const complexSceneResponse = `
---
SCENE 1: The Departure
Description: Rama leaves the palace with his family
Image Prompt: A royal palace at dawn with figures walking away
Video Prompt: Cinematic pan showing palace entrance and departing figures
---
SCENE 2: Forest Encounter
Description: Meeting with the sage Vishwamitra
Image Prompt: Ancient forest with a wise sage
Video Prompt: Slow approach through forest to reveal sage
---
SCENE 3: Demon Battle
Description: Combat with forest demons
Image Prompt: Epic battle scene in forest clearing
Video Prompt: Dynamic action sequence with magical effects
---
      `;

      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{ message: { content: complexSceneResponse } }],
      } as any);

      const caller = storiesRouter.createCaller(mockContext as any);
      const result = await caller.generateScenesFromStory({
        projectId: 1,
        storyDescription: "Rama's journey",
        storyType: "story",
        sceneCount: 3,
      });

      expect(result.success).toBe(true);
      expect(result.sceneCount).toBe(3);
      if (result.scenes) {
        expect(result.scenes[0].sceneNumber).toBe(1);
        expect(result.scenes[0].title).toBe("The Departure");
        expect(result.scenes[1].sceneNumber).toBe(2);
        expect(result.scenes[2].sceneNumber).toBe(3);
      }
    });
  });
});
