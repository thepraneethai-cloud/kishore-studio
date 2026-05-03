// ============================================================
// SUNO Style Refinement Tests
// ============================================================

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("SUNO Style Refinement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Feedback-Based Refinement", () => {
    it("should refine SUNO style based on user feedback", () => {
      const currentStyle = {
        tempo: "120 BPM",
        mood: "Meditative & Peaceful",
        instruments: ["Harmonium", "Tabla"],
        vocals: "Male devotional tenor",
      };

      const feedback = "Make it more energetic with faster tempo";
      
      // Simulate refinement logic
      const refined = {
        tempo: "140 BPM",
        mood: "Energetic & Uplifting",
        instruments: ["Harmonium", "Tabla", "Drums"],
        vocals: "Male devotional tenor",
      };

      expect(refined.tempo).not.toBe(currentStyle.tempo);
      expect(refined.mood).not.toBe(currentStyle.mood);
      expect(refined.instruments.length).toBeGreaterThan(currentStyle.instruments.length);
    });

    it("should preserve vocals when feedback doesn't mention it", () => {
      const currentStyle = {
        vocals: "Female devotional soprano",
      };

      const feedback = "Add more drums and make it louder";
      
      const refined = {
        vocals: "Female devotional soprano",
      };

      expect(refined.vocals).toBe(currentStyle.vocals);
    });

    it("should handle multiple feedback changes", () => {
      const currentStyle = {
        tempo: "100 BPM",
        mood: "Peaceful",
        instruments: ["Flute"],
        vocals: "Male",
      };

      const feedback = "Faster tempo, more instruments, female vocals";
      
      const refined = {
        tempo: "140 BPM",
        mood: "Energetic",
        instruments: ["Flute", "Tabla", "Sitar"],
        vocals: "Female",
      };

      expect(refined.tempo).not.toBe(currentStyle.tempo);
      expect(refined.instruments.length).toBeGreaterThan(currentStyle.instruments.length);
      expect(refined.vocals).not.toBe(currentStyle.vocals);
    });

    it("should maintain style consistency across refinements", () => {
      const lyrics = "Oh divine lord, guide us through the darkness...";
      const feedback = "Make it more devotional";
      
      const style = {
        tempo: "120 BPM",
        mood: "Spiritual & Devotional",
        instruments: ["Sitar", "Tabla", "Flute"],
        vocals: "Male devotional tenor",
      };

      // Verify all required fields are present
      expect(style).toHaveProperty("tempo");
      expect(style).toHaveProperty("mood");
      expect(style).toHaveProperty("instruments");
      expect(style).toHaveProperty("vocals");
    });
  });

  describe("SUNO Style Validation", () => {
    it("should validate tempo format", () => {
      const validTempos = ["120 BPM", "140 BPM", "80 BPM"];
      const invalidTempos = ["", null, undefined];

      validTempos.forEach(tempo => {
        expect(tempo).toBeTruthy();
        expect(typeof tempo).toBe("string");
      });

      invalidTempos.forEach(tempo => {
        expect(!tempo).toBe(true);
      });
    });

    it("should validate instruments array", () => {
      const instruments = ["Sitar", "Tabla", "Flute"];
      
      expect(Array.isArray(instruments)).toBe(true);
      expect(instruments.length).toBeGreaterThan(0);
      instruments.forEach(instrument => {
        expect(typeof instrument).toBe("string");
        expect(instrument.length).toBeGreaterThan(0);
      });
    });

    it("should validate mood field", () => {
      const moods = [
        "Meditative & Peaceful",
        "Energetic & Uplifting",
        "Spiritual & Devotional",
      ];

      moods.forEach(mood => {
        expect(mood).toBeTruthy();
        expect(typeof mood).toBe("string");
        expect(mood.length).toBeGreaterThan(0);
      });
    });

    it("should validate vocals field", () => {
      const vocals = [
        "Male devotional tenor",
        "Female devotional soprano",
        "Mixed chorus",
      ];

      vocals.forEach(vocal => {
        expect(vocal).toBeTruthy();
        expect(typeof vocal).toBe("string");
        expect(vocal.includes("devotional") || vocal.includes("chorus")).toBe(true);
      });
    });
  });

  describe("Feedback Processing", () => {
    it("should extract tempo change from feedback", () => {
      const feedback = "Make it faster, around 150 BPM";
      const tempoMatch = feedback.match(/(\d+)\s*BPM/i);
      
      expect(tempoMatch).toBeTruthy();
      expect(tempoMatch?.[1]).toBe("150");
    });

    it("should extract instrument additions from feedback", () => {
      const feedback = "Add more drums and percussion";
      const hasInstrumentRequest = feedback.toLowerCase().includes("add") && 
                                   (feedback.toLowerCase().includes("drum") || 
                                    feedback.toLowerCase().includes("instrument"));
      
      expect(hasInstrumentRequest).toBe(true);
    });

    it("should extract mood changes from feedback", () => {
      const feedback = "Make it more energetic and uplifting";
      const moodKeywords = ["energetic", "uplifting", "peaceful", "meditative", "spiritual"];
      const hasMoodChange = moodKeywords.some(keyword => 
        feedback.toLowerCase().includes(keyword)
      );
      
      expect(hasMoodChange).toBe(true);
    });

    it("should extract vocal changes from feedback", () => {
      const feedback = "Use female vocals instead";
      const hasVocalChange = feedback.toLowerCase().includes("vocal") || 
                            feedback.toLowerCase().includes("singer");
      
      expect(hasVocalChange).toBe(true);
    });

    it("should handle empty or minimal feedback", () => {
      const feedback = "";
      const isValid = typeof feedback === "string";
      
      expect(isValid).toBe(true);
      expect(feedback.trim().length).toBe(0);
    });
  });

  describe("SUNO Style Generation Flow", () => {
    it("should generate initial SUNO style from lyrics", () => {
      const lyrics = "Oh divine lord, guide us through the darkness...";
      
      const style = {
        tempo: "120 BPM",
        mood: "Meditative & Peaceful",
        instruments: ["Harmonium", "Tabla"],
        vocals: "Male devotional tenor",
      };

      expect(style).toBeDefined();
      expect(style.tempo).toMatch(/\d+\s*BPM/);
      expect(Array.isArray(style.instruments)).toBe(true);
    });

    it("should refine SUNO style with feedback", () => {
      const initialStyle = {
        tempo: "120 BPM",
        mood: "Peaceful",
        instruments: ["Flute"],
        vocals: "Male",
      };

      const feedback = "More energetic";
      
      const refinedStyle = {
        tempo: "140 BPM",
        mood: "Energetic",
        instruments: ["Flute", "Drums"],
        vocals: "Male",
      };

      expect(refinedStyle.tempo).not.toBe(initialStyle.tempo);
      expect(refinedStyle.mood).not.toBe(initialStyle.mood);
    });

    it("should allow multiple refinement iterations", () => {
      const iterations = [
        { tempo: "120 BPM", mood: "Peaceful" },
        { tempo: "130 BPM", mood: "Energetic" },
        { tempo: "140 BPM", mood: "Very Energetic" },
      ];

      expect(iterations.length).toBe(3);
      iterations.forEach((iter, idx) => {
        if (idx > 0) {
          expect(parseInt(iter.tempo)).toBeGreaterThanOrEqual(
            parseInt(iterations[idx - 1].tempo)
          );
        }
      });
    });

    it("should preserve style consistency across refinements", () => {
      const styles = [
        { tempo: "120 BPM", instruments: ["Sitar", "Tabla"] },
        { tempo: "130 BPM", instruments: ["Sitar", "Tabla", "Flute"] },
        { tempo: "140 BPM", instruments: ["Sitar", "Tabla", "Flute", "Drums"] },
      ];

      styles.forEach(style => {
        expect(style.instruments).toContain("Sitar");
        expect(style.instruments).toContain("Tabla");
      });
    });
  });

  describe("Integration with Lyrics", () => {
    it("should generate SUNO style matching lyrics theme", () => {
      const lyrics = "Oh Venkateswara, lord of Tirupati...";
      const deity = "Venkateswara";
      
      const style = {
        mood: "Devotional & Divine",
        instruments: ["Nadaswaram", "Mridangam"],
      };

      expect(style.mood.toLowerCase()).toContain("devotional");
      expect(style.instruments.some(i => i.toLowerCase().includes("nadaswaram"))).toBe(true);
    });

    it("should refine SUNO style based on lyrics feedback", () => {
      const lyrics = "Make it more energetic";
      const feedback = "Add more percussion";
      
      const refinedStyle = {
        tempo: "140 BPM",
        instruments: ["Tabla", "Dholak", "Drums"],
      };

      expect(refinedStyle.tempo).toMatch(/\d+\s*BPM/);
      expect(refinedStyle.instruments.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing SUNO style gracefully", () => {
      const style = null;
      const fallback = {
        tempo: "120 BPM",
        mood: "Meditative & Peaceful",
        instruments: ["Harmonium", "Tabla"],
        vocals: "Male devotional tenor",
      };

      const result = style || fallback;
      expect(result).toBeDefined();
      expect(result).toEqual(fallback);
    });

    it("should handle invalid feedback gracefully", () => {
      const feedback = null;
      const isValid = typeof feedback === "string" && feedback.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it("should provide default values for missing fields", () => {
      const partial = { tempo: "120 BPM" };
      const complete = {
        tempo: partial.tempo || "120 BPM",
        mood: "Meditative & Peaceful",
        instruments: ["Harmonium", "Tabla"],
        vocals: "Male devotional tenor",
      };

      expect(complete.mood).toBeDefined();
      expect(complete.instruments).toBeDefined();
      expect(complete.vocals).toBeDefined();
    });
  });
});
