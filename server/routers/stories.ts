// ============================================================
// DESIGN: Story/Mythology Mode Router
// ============================================================

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getUserSettings } from "../db";
import { projects, scenes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";

function resolveKey(envKey: string, userSupplied?: string | null): string {
  return (envKey && envKey.length > 0) ? envKey : (userSupplied ?? "");
}

export const storiesRouter = router({
  // ============================================================
  // CREATE STORY PROJECT
  // ============================================================
  createStoryProject: protectedProcedure
    .input(
      z.object({
        storyTitle: z.string().min(3).max(255),
        storyDescription: z.string().min(10).max(2000),
        storyType: z.enum(["story", "mythology", "custom"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db.insert(projects).values({
          userId: ctx.user.id,
          name: input.storyTitle,
          type: input.storyType,
          storyTitle: input.storyTitle,
          storyDescription: input.storyDescription,
          status: "draft",
        });

        // Get the inserted project ID
        const insertedProject = await db.select().from(projects).where(eq(projects.userId, ctx.user.id)).orderBy((t) => t.id).limit(1);

        return {
          success: true,
          projectId: insertedProject[0]?.id || 0,
          message: "Story project created",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create story project",
        };
      }
    }),

  // ============================================================
  // AUTO-GENERATE SCENES FROM STORY
  // ============================================================
  generateScenesFromStory: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        storyDescription: z.string(),
        storyType: z.enum(["story", "mythology", "custom"]),
        sceneCount: z.number().min(3).max(20).default(7),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userSettings = await getUserSettings(ctx.user.id);
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Generate scenes using LLM
        const scenesPrompt = buildScenesPrompt(
          input.storyDescription,
          input.storyType,
          input.sceneCount
        );

        const result = await invokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  "You are an expert story director specializing in visual storytelling for Indian epics and mythology. " +
                  "Generate vivid, cinematic scene descriptions that can be visualized as images and videos.",
              },
              {
                role: "user",
                content: scenesPrompt,
              },
            ],
            maxTokens: 3000,
          },
          {
            ...(resolveKey(ENV.geminiApiKey, userSettings?.geminiApiKey) ? { apiKey: resolveKey(ENV.geminiApiKey, userSettings?.geminiApiKey) } : {}),
            model: input.llmModel || userSettings?.llmModel || undefined,
            ...(resolveKey(ENV.openaiApiKey, userSettings?.openaiApiKey) ? { openaiApiKey: resolveKey(ENV.openaiApiKey, userSettings?.openaiApiKey) } : {}),
            ...(resolveKey(ENV.claudeApiKey, userSettings?.claudeApiKey) ? { claudeApiKey: resolveKey(ENV.claudeApiKey, userSettings?.claudeApiKey) } : {}),
            ...(resolveKey(ENV.groqApiKey, userSettings?.groqApiKey) ? { groqApiKey: resolveKey(ENV.groqApiKey, userSettings?.groqApiKey) } : {}),
            ...(resolveKey(ENV.mistralApiKey, userSettings?.mistralApiKey) ? { mistralApiKey: resolveKey(ENV.mistralApiKey, userSettings?.mistralApiKey) } : {}),
          }
        );

        const scenesText = (result.choices[0]?.message?.content ?? "").toString();
        const parsedScenes = parseScenes(scenesText);

        // Save scenes to database
        const sceneRecords = parsedScenes.map((scene, index) => ({
          projectId: input.projectId,
          sceneNumber: index + 1,
          description: scene.description,
          imagePrompt: scene.imagePrompt,
          videoPrompt: scene.videoPrompt,
        }));

        await db.insert(scenes).values(sceneRecords);

        return {
          success: true,
          sceneCount: parsedScenes.length,
          scenes: parsedScenes,
          message: `Generated ${parsedScenes.length} scenes`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate scenes",
        };
      }
    }),

  // ============================================================
  // GET STORY SCENES
  // ============================================================
  getStoryScenes: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const storyScenes = await db
          .select()
          .from(scenes)
          .where(eq(scenes.projectId, input.projectId));

        return {
          success: true,
          scenes: storyScenes,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch scenes",
        };
      }
    }),

  // ============================================================
  // UPDATE SCENE
  // ============================================================
  updateScene: protectedProcedure
    .input(
      z.object({
        sceneId: z.number(),
        description: z.string().optional(),
        imagePrompt: z.string().optional(),
        videoPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const updateData: Record<string, any> = {};
        if (input.description) updateData.description = input.description;
        if (input.imagePrompt) updateData.imagePrompt = input.imagePrompt;
        if (input.videoPrompt) updateData.videoPrompt = input.videoPrompt;

        await db.update(scenes).set(updateData).where(eq(scenes.id, input.sceneId));

        return {
          success: true,
          message: "Scene updated",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update scene",
        };
      }
    }),
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function buildScenesPrompt(
  storyDescription: string,
  storyType: string,
  sceneCount: number
): string {
  return `
Break down this ${storyType} story into ${sceneCount} cinematic scenes:

Story: ${storyDescription}

For each scene, provide:
1. Scene number and title
2. Detailed visual description (what we see on screen)
3. Image prompt (for AI image generation - vivid, detailed, cinematic)
4. Video prompt (for AI video generation - motion, action, cinematography style)

Format each scene as:
---
SCENE [N]: [Title]
Description: [Visual description]
Image Prompt: [Detailed image generation prompt]
Video Prompt: [Motion and cinematography prompt]
---

Make the scenes:
- Visually distinct and cinematic
- True to the story and cultural context
- Suitable for video production
- Progressively building narrative tension
`;
}

interface ParsedScene {
  sceneNumber: number;
  title: string;
  description: string;
  imagePrompt: string;
  videoPrompt: string;
}

function parseScenes(text: string): ParsedScene[] {
  const sceneBlocks = text.split(/---/g).filter((block) => block.trim());
  const scenes: ParsedScene[] = [];

  sceneBlocks.forEach((block) => {
    const lines = block.split("\n").map((l) => l.trim());

    let sceneNumber = 0;
    let title = "";
    let description = "";
    let imagePrompt = "";
    let videoPrompt = "";

    lines.forEach((line) => {
      if (line.startsWith("SCENE")) {
        const match = line.match(/SCENE\s+(\d+):\s*(.*)/);
        if (match) {
          sceneNumber = parseInt(match[1]);
          title = match[2];
        }
      } else if (line.startsWith("Description:")) {
        description = line.replace("Description:", "").trim();
      } else if (line.startsWith("Image Prompt:")) {
        imagePrompt = line.replace("Image Prompt:", "").trim();
      } else if (line.startsWith("Video Prompt:")) {
        videoPrompt = line.replace("Video Prompt:", "").trim();
      }
    });

    if (sceneNumber > 0 && description) {
      scenes.push({
        sceneNumber,
        title,
        description,
        imagePrompt: imagePrompt || description,
        videoPrompt: videoPrompt || description,
      });
    }
  });

  return scenes;
}
