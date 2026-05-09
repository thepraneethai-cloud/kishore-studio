// ============================================================
// Scene Director Agent
// Analyzes the emotional arc of a devotional song and applies
// professional cinematic shot vocabulary (WS/MS/CU/ECU) plus
// camera movement semantics to each scene.
// ============================================================

import { invokeLLM } from "./llm";

export type ShotType = "WS" | "MS" | "CU" | "ECU";
export type CameraMovement = "push-in" | "pull-back" | "pan" | "tilt-up" | "static";
export type EmotionalWeight = "reverent" | "longing" | "devotional" | "ecstatic" | "surrendered";

export interface SceneDirectorInput {
  sceneId: number;
  lyricLine: string;
  sceneDescription: string;
}

export interface DirectedScene {
  id: number;
  emotionalWeight: EmotionalWeight;
  shotType: ShotType;
  cameraMovement: CameraMovement;
  directorNote: string;
  enrichedImagePrompt: string;
  enrichedMotionPrompt: string;
}

export interface CinematicStyle {
  colorPalette: string;
  lightingStyle: string;
  moodArc: string;
}

export interface DirectorAnalysisResult {
  cinematicStyle: CinematicStyle;
  scenes: DirectedScene[];
}

const SHOT_TYPE_LABELS: Record<ShotType, string> = {
  WS:  "wide establishing shot, full environment visible, subject small",
  MS:  "medium shot, subject centered, environment present, devotional distance",
  CU:  "close-up, face or sacred object prominent, shallow depth of field",
  ECU: "extreme close-up, intimate sacred detail, deep bokeh background",
};

const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, string> = {
  "push-in":    "slow dolly push-in toward subject (0.3x zoom over 6s), approaching truth",
  "pull-back":  "slow pull-back reveal (0.3x zoom-out over 6s), scale and vastness emerging",
  "pan":        "slow horizontal pan (left to right), sweeping and exploring sacred space",
  "tilt-up":    "slow upward tilt toward sky or deity, aspiration and reverence",
  "static":     "perfectly locked-off camera, still as meditation, gravity and finality",
};

function buildDirectorPrompt(deity: string, scenes: SceneDirectorInput[]): string {
  const scenesText = scenes
    .map((s) => `[ID:${s.sceneId}] Lyric: "${s.lyricLine}" | Visual: ${s.sceneDescription}`)
    .join("\n");

  return `You are a professional Indian music video director specializing in South Indian devotional content for YouTube. You are analyzing a Telugu devotional song about ${deity}.

Your task: assign professional cinematic direction to each scene to create a coherent, emotionally dynamic video that builds from reverence to ecstasy and returns to surrender.

SONG STRUCTURE CONTEXT:
- Pallavi (chorus lines): highest emotional peak — use ECU and CU, push-in movements
- Charanam (verse lines): mid-level — use MS and CU, varied movements
- Opening lines: establish with WS, slow pull-back or static
- Final lines: surrender and resolution — return to WS or static

SHOT TYPE VOCABULARY:
- WS (Wide Shot): establishes sacred space, deity/environment relationship
- MS (Medium Shot): devotee perspective, participatory distance, mid-devotion
- CU (Close-Up): intimate connection, deity's form details, emotional peak
- ECU (Extreme Close-Up): sacred detail — eyes, lotus feet, sacred objects, divine symbols

CAMERA MOVEMENT SEMANTICS:
- push-in: approaching truth/deity, building devotion, drawing closer
- pull-back: revealing scale and vastness, cosmic perspective
- pan: sweeping across sacred landscape or temple, exploring
- tilt-up: aspiration, looking toward the divine, reverence
- static: stillness as meditation, finality, total surrender

EMOTIONAL WEIGHT PROGRESSION (for a 3-4 minute devotional video):
- reverent: opening, establishing sacred mood
- longing: the heart yearning toward the divine
- devotional: active worship, offering
- ecstatic: peak of devotional bliss, divine presence felt
- surrendered: peaceful resolution, grace received

Return ONLY valid JSON — no markdown, no explanation, no code blocks:
{
  "cinematicStyle": {
    "colorPalette": "2-3 sentence description of the dominant color language for ALL images",
    "lightingStyle": "2-3 sentence description of consistent lighting across the video",
    "moodArc": "2-3 sentence description of the emotional journey from first to last scene"
  },
  "scenes": [
    {
      "id": <scene_id_integer>,
      "emotionalWeight": "<reverent|longing|devotional|ecstatic|surrendered>",
      "shotType": "<WS|MS|CU|ECU>",
      "cameraMovement": "<push-in|pull-back|pan|tilt-up|static>",
      "directorNote": "<one sentence: the cinematic WHY behind this choice>",
      "enrichedImagePrompt": "<15-25 word image prompt incorporating shot type and composition>",
      "enrichedMotionPrompt": "<15-20 word motion prompt incorporating camera movement and duration>"
    }
  ]
}

SCENES TO ANALYZE (${scenes.length} total):
${scenesText}`;
}

export async function analyzeSceneArc(
  deity: string,
  scenes: SceneDirectorInput[],
  llmApiKey?: string
): Promise<DirectorAnalysisResult> {
  if (scenes.length === 0) {
    throw new Error("No scenes to analyze");
  }

  const prompt = buildDirectorPrompt(deity, scenes);

  const result = await invokeLLM(
    {
      messages: [
        {
          role: "system",
          content: "You are a professional Indian music video director. Return only valid JSON with no markdown fences, no explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 4000,
    },
    llmApiKey ? { apiKey: llmApiKey } : undefined
  );

  const rawContent = result.choices[0]?.message?.content ?? "";
  const raw = (typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent)).trim();

  // Strip any accidental markdown code fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: DirectorAnalysisResult;
  try {
    parsed = JSON.parse(cleaned) as DirectorAnalysisResult;
  } catch {
    throw new Error(`Director agent returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }

  // Validate structure and fill defaults for any missing scenes
  const sceneIds = new Set(scenes.map((s) => s.sceneId));
  const returnedIds = new Set(parsed.scenes?.map((s) => s.id) ?? []);

  // Ensure every input scene has a corresponding output
  for (const scene of scenes) {
    if (!returnedIds.has(scene.sceneId)) {
      parsed.scenes.push({
        id: scene.sceneId,
        emotionalWeight: "devotional",
        shotType: "MS",
        cameraMovement: "push-in",
        directorNote: "Default medium shot — devotional framing",
        enrichedImagePrompt: `${scene.sceneDescription}, medium devotional shot, temple setting, warm gold light`,
        enrichedMotionPrompt: `Slow dolly push-in, 6 seconds, meditative pace`,
      });
    }
  }

  // Enrich image/motion prompts that the LLM may have left sparse
  parsed.scenes = parsed.scenes.map((s) => {
    const shotLabel = SHOT_TYPE_LABELS[s.shotType] ?? SHOT_TYPE_LABELS.MS;
    const moveLabel = CAMERA_MOVEMENT_LABELS[s.cameraMovement] ?? CAMERA_MOVEMENT_LABELS["push-in"];
    // If LLM returned a short prompt, pad with cinematic vocabulary
    const enrichedImage =
      s.enrichedImagePrompt && s.enrichedImagePrompt.length > 20
        ? s.enrichedImagePrompt
        : `${shotLabel}, ${s.enrichedImagePrompt || "devotional scene"}, warm temple atmosphere`;
    const enrichedMotion =
      s.enrichedMotionPrompt && s.enrichedMotionPrompt.length > 20
        ? s.enrichedMotionPrompt
        : `${moveLabel}, soft particle glow, 6 second loop`;
    return { ...s, enrichedImagePrompt: enrichedImage, enrichedMotionPrompt: enrichedMotion };
  });

  // Sort by original input order
  const orderMap = new Map(scenes.map((s, i) => [s.sceneId, i]));
  parsed.scenes.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  return parsed;
}
