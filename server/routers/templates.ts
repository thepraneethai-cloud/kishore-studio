import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { promptTemplates, sunoStyleTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ── Default theme-based prompt templates ──────────────────────
const DEFAULT_PROMPT_TEMPLATES = [
  {
    theme: "deity",
    name: "Devotional Bhajan",
    prompt: "Write a devotional bhajan in Telugu with Pallavi and 2 Charanams. Focus on divine names, sacred places, and devotional surrender. Keep the tone reverent and meditative.",
  },
  {
    theme: "deity",
    name: "Temple Keertana",
    prompt: "Write a traditional temple keertana in Telugu praising the deity. Include references to the deity's abode, divine attributes, and blessings. Use classical Carnatic lyrical structure.",
  },
  {
    theme: "deity",
    name: "Morning Prayer (Suprabhatam)",
    prompt: "Write a Suprabhatam-style morning prayer in Telugu. Wake the deity with gentle, loving words describing dawn, nature, and divine beauty. Include Pallavi and 3 Charanams.",
  },
  {
    theme: "love",
    name: "Divine Love Song",
    prompt: "Write a Telugu love song expressing divine love (prema bhakti). Blend romantic imagery with spiritual devotion. Use metaphors of nature, moonlight, and eternal love.",
  },
  {
    theme: "love",
    name: "Romantic Melody",
    prompt: "Write a romantic Telugu song with poetic imagery. Include themes of longing, union, and celebration of love. Use gentle, flowing language with Pallavi and 2 Charanams.",
  },
  {
    theme: "folk",
    name: "Village Folk Song",
    prompt: "Write a Telugu folk song (Janapadha Geethalu) with earthy, rustic language. Include references to village life, harvest, festivals, and community celebrations. Use repetitive chorus patterns.",
  },
  {
    theme: "folk",
    name: "Festival Celebration",
    prompt: "Write a festive Telugu folk song for Sankranti/Ugadi/Bathukamma. Include traditional customs, food, dance, and community joy. Use energetic, rhythmic patterns.",
  },
  {
    theme: "mass",
    name: "Mass Appeal Anthem",
    prompt: "Write a high-energy Telugu mass song with powerful, catchy lyrics. Include strong beats, crowd-chanting sections, and motivational themes. Make it suitable for large gatherings.",
  },
  {
    theme: "mass",
    name: "Patriotic/Inspirational",
    prompt: "Write an inspirational Telugu song about strength, courage, and pride. Use powerful imagery and rallying language. Include a memorable chorus that audiences can sing along to.",
  },
  {
    theme: "classical",
    name: "Carnatic Composition",
    prompt: "Write a classical Carnatic-style Telugu composition (Kriti). Follow the Pallavi-Anupallavi-Charanam structure. Include raga-appropriate phrases and traditional poetic meters.",
  },
  {
    theme: "classical",
    name: "Philosophical Verse",
    prompt: "Write a philosophical Telugu song exploring themes of life, death, karma, and moksha. Use deep, contemplative language with references to Vedantic wisdom.",
  },
  {
    theme: "lullaby",
    name: "Divine Lullaby (Jolapata)",
    prompt: "Write a gentle Telugu lullaby (Jolapata) for baby Krishna or a divine child. Use soft, soothing words with imagery of moonlight, cradles, and mother's love. Keep it short and melodic.",
  },
];

// ── Default SUNO style templates ──────────────────────────────
const DEFAULT_SUNO_STYLES = [
  {
    theme: "deity",
    name: "Traditional Bhajan",
    tempo: "slow",
    style: "Devotional Bhajan, Carnatic classical fusion",
    mood: "Divine & Calm",
    instruments: ["Veena", "Mridangam", "Flute", "Harmonium", "Bells"],
    vocals: "Male devotional tenor with classical training",
  },
  {
    theme: "deity",
    name: "Temple Nadaswaram",
    tempo: "medium",
    style: "Temple music, Nadaswaram-led devotional",
    mood: "Majestic & Powerful",
    instruments: ["Nadaswaram", "Tavil", "Bells", "Mridangam"],
    vocals: "Male chorus with lead devotional voice",
  },
  {
    theme: "love",
    name: "Romantic Melody",
    tempo: "medium",
    style: "Romantic Telugu film music, melodic",
    mood: "Emotional & Devotional",
    instruments: ["Violin", "Flute", "Guitar", "Sitar", "Tabla"],
    vocals: "Soft male/female duet",
  },
  {
    theme: "love",
    name: "Gentle Ballad",
    tempo: "slow",
    style: "Acoustic ballad, intimate",
    mood: "Meditative & Peaceful",
    instruments: ["Guitar", "Violin", "Piano", "Flute"],
    vocals: "Soft female vocal, breathy",
  },
  {
    theme: "folk",
    name: "Village Drums",
    tempo: "energetic",
    style: "Telugu folk, Janapadha, earthy rhythms",
    mood: "Joyful & Celebratory",
    instruments: ["Dholak", "Dappu", "Flute", "Harmonium", "Bells"],
    vocals: "Energetic male folk singer with chorus",
  },
  {
    theme: "folk",
    name: "Bathukamma Beat",
    tempo: "energetic",
    style: "Telangana folk, festival rhythm",
    mood: "Joyful & Celebratory",
    instruments: ["Dappu", "Dholak", "Harmonium", "Bells", "Claps"],
    vocals: "Female group vocal, call and response",
  },
  {
    theme: "mass",
    name: "High Energy Beat",
    tempo: "energetic",
    style: "Mass Telugu film music, heavy bass, electronic",
    mood: "Majestic & Powerful",
    instruments: ["Drums", "Bass Guitar", "Synthesizer", "Trumpet", "Tabla"],
    vocals: "Powerful male vocal with crowd chants",
  },
  {
    theme: "classical",
    name: "Carnatic Pure",
    tempo: "classical",
    style: "Pure Carnatic, raga-based composition",
    mood: "Meditative & Peaceful",
    instruments: ["Veena", "Mridangam", "Violin", "Ghatam", "Kanjira"],
    vocals: "Classical trained male/female vocalist",
  },
  {
    theme: "lullaby",
    name: "Gentle Cradle Song",
    tempo: "slow",
    style: "Soft lullaby, minimal instrumentation",
    mood: "Divine & Calm",
    instruments: ["Flute", "Veena", "Bells", "Santoor"],
    vocals: "Soft female vocal, motherly",
  },
];

export const templatesRouter = router({
  // ── Prompt Templates ────────────────────────────────────────

  listPromptTemplates: protectedProcedure
    .input(z.object({ theme: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Get user's custom templates
      const conditions = [eq(promptTemplates.userId, ctx.user.id)];
      if (input.theme) {
        conditions.push(eq(promptTemplates.theme, input.theme));
      }
      const database = await getDb();
      if (!database) return { defaults: [], custom: [] };
      const userTemplates = await database
        .select()
        .from(promptTemplates)
        .where(and(...conditions));

      // Filter defaults by theme if specified
      const defaults = input.theme
        ? DEFAULT_PROMPT_TEMPLATES.filter((t) => t.theme === input.theme)
        : DEFAULT_PROMPT_TEMPLATES;

      return {
        defaults: defaults.map((t, i) => ({
          id: -(i + 1), // negative IDs for defaults
          ...t,
          isDefault: 1,
          userId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        custom: userTemplates,
      };
    }),

  savePromptTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        theme: z.string().min(1),
        prompt: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const [result] = await database.insert(promptTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        theme: input.theme,
        prompt: input.prompt,
        isDefault: 0,
      });
      return { success: true, id: result.insertId };
    }),

  deletePromptTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      await database
        .delete(promptTemplates)
        .where(
          and(
            eq(promptTemplates.id, input.id),
            eq(promptTemplates.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // ── SUNO Style Templates ────────────────────────────────────

  listSunoStyles: protectedProcedure
    .input(z.object({ theme: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(sunoStyleTemplates.userId, ctx.user.id)];
      if (input.theme) {
        conditions.push(eq(sunoStyleTemplates.theme, input.theme));
      }
      const database = await getDb();
      if (!database) return { defaults: [], custom: [] };
      const userStyles = await database
        .select()
        .from(sunoStyleTemplates)
        .where(and(...conditions));

      const defaults = input.theme
        ? DEFAULT_SUNO_STYLES.filter((s) => s.theme === input.theme)
        : DEFAULT_SUNO_STYLES;

      return {
        defaults: defaults.map((s, i) => ({
          id: -(i + 1),
          ...s,
          isDefault: 1,
          userId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        custom: userStyles,
      };
    }),

  saveSunoStyle: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        theme: z.string().min(1),
        tempo: z.string().min(1),
        style: z.string().min(1),
        mood: z.string().min(1),
        instruments: z.array(z.string()),
        vocals: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const [result] = await database.insert(sunoStyleTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        theme: input.theme,
        tempo: input.tempo,
        style: input.style,
        mood: input.mood,
        instruments: input.instruments,
        vocals: input.vocals,
        isDefault: 0,
      });
      return { success: true, id: result.insertId };
    }),

  deleteSunoStyle: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      await database
        .delete(sunoStyleTemplates)
        .where(
          and(
            eq(sunoStyleTemplates.id, input.id),
            eq(sunoStyleTemplates.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // ── Get available themes ────────────────────────────────────
  getThemes: protectedProcedure.query(() => {
    return [
      { key: "deity", label: "Deity / Devotional", icon: "🙏" },
      { key: "love", label: "Love / Romance", icon: "💕" },
      { key: "folk", label: "Folk / Janapadha", icon: "🪘" },
      { key: "mass", label: "Mass / High Energy", icon: "🔥" },
      { key: "classical", label: "Classical / Carnatic", icon: "🎵" },
      { key: "lullaby", label: "Lullaby / Jolapata", icon: "🌙" },
    ];
  }),
});
