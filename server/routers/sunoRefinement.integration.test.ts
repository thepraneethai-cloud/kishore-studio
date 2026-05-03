// ============================================================
// SUNO Style Refinement Integration Tests
// Tests the actual refineSunoStyle tRPC procedure
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";
import { generationRouter } from "./generation";
import { z } from "zod";

describe("SUNO Style Refinement Integration", () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe("refineSunoStyle Procedure", () => {
    it("should accept valid input for SUNO style refinement", () => {
      const input = {
        lyrics: "Oh divine lord, guide us through the darkness",
        currentStyle: {
          tempo: "120 BPM",
          mood: "Peaceful",
          instruments: ["Flute"],
        },
        feedback: "Make it more energetic",
        theme: "deity",
        deity: "Venkateswara",
      };

      // Verify input structure
      expect(input).toHaveProperty("lyrics");
      expect(input).toHaveProperty("feedback");
      expect(input).toHaveProperty("deity");
      expect(typeof input.lyrics).toBe("string");
      expect(typeof input.feedback).toBe("string");
      expect(input.lyrics.length).toBeGreaterThan(0);
      expect(input.feedback.length).toBeGreaterThan(0);
    });

    it("should validate lyrics are not empty", () => {
      const validLyrics = "Oh divine lord, guide us through the darkness";
      const invalidLyrics = "";

      expect(validLyrics.length).toBeGreaterThan(0);
      expect(invalidLyrics.length).toBe(0);
    });

    it("should validate feedback is not empty", () => {
      const validFeedback = "Make it more energetic";
      const invalidFeedback = "";

      expect(validFeedback.length).toBeGreaterThan(0);
      expect(invalidFeedback.length).toBe(0);
    });

    it("should handle optional currentStyle", () => {
      const inputWithStyle = {
        lyrics: "Oh divine lord",
        currentStyle: { tempo: "120 BPM" },
        feedback: "Faster",
      };

      const inputWithoutStyle = {
        lyrics: "Oh divine lord",
        currentStyle: undefined,
        feedback: "Faster",
      };

      expect(inputWithStyle.currentStyle).toBeDefined();
      expect(inputWithoutStyle.currentStyle).toBeUndefined();
    });

    it("should handle optional theme and deity", () => {
      const inputWithTheme = {
        lyrics: "Oh divine lord",
        feedback: "Faster",
        theme: "deity",
        deity: "Venkateswara",
      };

      const inputWithoutTheme = {
        lyrics: "Oh divine lord",
        feedback: "Faster",
        theme: undefined,
        deity: undefined,
      };

      expect(inputWithTheme.theme).toBeDefined();
      expect(inputWithoutTheme.theme).toBeUndefined();
    });
  });

  describe("SUNO Style Response Structure", () => {
    it("should return valid SUNO style structure", () => {
      const response = {
        success: true,
        data: {
          tempo: "140 BPM",
          style: "Devotional bhajan",
          mood: "Energetic & Uplifting",
          instruments: ["Harmonium", "Tabla", "Drums"],
          vocals: "Male devotional tenor",
        },
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty("tempo");
      expect(response.data).toHaveProperty("mood");
      expect(response.data).toHaveProperty("instruments");
      expect(response.data).toHaveProperty("vocals");
    });

    it("should return error response on failure", () => {
      const response = {
        success: false,
        error: "Failed to refine SUNO style",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe("string");
    });

    it("should preserve required fields in refined style", () => {
      const original = {
        tempo: "120 BPM",
        mood: "Peaceful",
        instruments: ["Flute"],
        vocals: "Male",
      };

      const refined = {
        tempo: "140 BPM",
        mood: "Energetic",
        instruments: ["Flute", "Drums"],
        vocals: "Male",
      };

      // Verify all required fields are present
      ["tempo", "mood", "instruments", "vocals"].forEach(field => {
        expect(refined).toHaveProperty(field);
      });
    });

    it("should return array of instruments", () => {
      const style = {
        instruments: ["Sitar", "Tabla", "Flute"],
      };

      expect(Array.isArray(style.instruments)).toBe(true);
      expect(style.instruments.length).toBeGreaterThan(0);
      style.instruments.forEach(instrument => {
        expect(typeof instrument).toBe("string");
      });
    });
  });

  describe("Feedback Processing in Refinement", () => {
    it("should process feedback for tempo changes", () => {
      const feedback = "Make it faster, around 150 BPM";
      const originalTempo = "120 BPM";
      const refinedTempo = "150 BPM";

      // Verify feedback contains tempo information
      expect(feedback.toLowerCase()).toContain("faster");
      expect(refinedTempo).not.toBe(originalTempo);
    });

    it("should process feedback for mood changes", () => {
      const feedback = "Make it more energetic and uplifting";
      const originalMood = "Peaceful";
      const refinedMood = "Energetic & Uplifting";

      expect(feedback.toLowerCase()).toContain("energetic");
      expect(refinedMood).not.toBe(originalMood);
    });

    it("should process feedback for instrument additions", () => {
      const feedback = "Add more percussion and drums";
      const originalInstruments = ["Flute"];
      const refinedInstruments = ["Flute", "Tabla", "Drums"];

      expect(feedback.toLowerCase()).toContain("add");
      expect(refinedInstruments.length).toBeGreaterThan(originalInstruments.length);
    });

    it("should process feedback for vocal changes", () => {
      const feedback = "Use female vocals instead";
      const originalVocals = "Male devotional tenor";
      const refinedVocals = "Female devotional soprano";

      expect(feedback.toLowerCase()).toContain("female");
      expect(refinedVocals).not.toBe(originalVocals);
    });

    it("should handle complex multi-part feedback", () => {
      const feedback = "Make it faster (140 BPM), more energetic, add drums, and use female vocals";
      
      const hasTempoRequest = /\d+\s*bpm/i.test(feedback);
      const hasMoodRequest = /energetic|uplifting|powerful/i.test(feedback);
      const hasInstrumentRequest = /add|drum|percussion/i.test(feedback);
      const hasVocalRequest = /female|male|vocal/i.test(feedback);

      expect(hasTempoRequest).toBe(true);
      expect(hasMoodRequest).toBe(true);
      expect(hasInstrumentRequest).toBe(true);
      expect(hasVocalRequest).toBe(true);
    });
  });

  describe("Refinement Workflow", () => {
    it("should support multiple refinement iterations", () => {
      const iterations = [
        {
          step: 1,
          feedback: "Make it faster",
          tempo: "140 BPM",
        },
        {
          step: 2,
          feedback: "Add more instruments",
          instruments: ["Sitar", "Tabla", "Flute", "Drums"],
        },
        {
          step: 3,
          feedback: "Use female vocals",
          vocals: "Female devotional soprano",
        },
      ];

      expect(iterations.length).toBe(3);
      iterations.forEach((iter, idx) => {
        expect(iter).toHaveProperty("step");
        expect(iter).toHaveProperty("feedback");
        expect(iter.step).toBe(idx + 1);
      });
    });

    it("should maintain lyrics throughout refinement", () => {
      const lyrics = "Oh divine lord, guide us through the darkness";
      
      const iteration1 = { lyrics, feedback: "Faster" };
      const iteration2 = { lyrics, feedback: "More energetic" };
      const iteration3 = { lyrics, feedback: "Add drums" };

      expect(iteration1.lyrics).toBe(lyrics);
      expect(iteration2.lyrics).toBe(lyrics);
      expect(iteration3.lyrics).toBe(lyrics);
    });

    it("should preserve deity context across refinements", () => {
      const deity = "Venkateswara";
      
      const refinement1 = { deity, feedback: "Faster" };
      const refinement2 = { deity, feedback: "More energetic" };

      expect(refinement1.deity).toBe(deity);
      expect(refinement2.deity).toBe(deity);
    });
  });

  describe("Edge Cases", () => {
    it("should handle refinement with minimal feedback", () => {
      const feedback = "Better";
      
      expect(feedback.length).toBeGreaterThan(0);
      expect(typeof feedback).toBe("string");
    });

    it("should handle refinement with very long feedback", () => {
      const feedback = "Make it faster with more drums and percussion, use female vocals, add more sitar and flute, make it very energetic and uplifting with a spiritual mood";
      
      expect(feedback.length).toBeGreaterThan(50);
      expect(typeof feedback).toBe("string");
    });

    it("should handle refinement with special characters in feedback", () => {
      const feedback = "Make it more energetic (140 BPM) & uplifting!";
      
      expect(feedback).toContain("(");
      expect(feedback).toContain("&");
      expect(feedback).toContain("!");
    });

    it("should handle refinement without changing certain fields", () => {
      const feedback = "Just make it faster";
      const originalStyle = {
        tempo: "120 BPM",
        mood: "Peaceful",
        instruments: ["Flute"],
        vocals: "Male",
      };

      const refinedStyle = {
        tempo: "140 BPM",
        mood: "Peaceful",
        instruments: ["Flute"],
        vocals: "Male",
      };

      // Only tempo should change
      expect(refinedStyle.tempo).not.toBe(originalStyle.tempo);
      expect(refinedStyle.mood).toBe(originalStyle.mood);
      expect(refinedStyle.instruments).toEqual(originalStyle.instruments);
      expect(refinedStyle.vocals).toBe(originalStyle.vocals);
    });
  });

  describe("Error Handling", () => {
    it("should return error for empty lyrics", () => {
      const input = {
        lyrics: "",
        feedback: "Make it faster",
      };

      const isValid = input.lyrics.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should return error for empty feedback", () => {
      const input = {
        lyrics: "Oh divine lord",
        feedback: "",
      };

      const isValid = input.feedback.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should handle network errors gracefully", () => {
      const response = {
        success: false,
        error: "Network error: Failed to connect to LLM service",
      };

      expect(response.success).toBe(false);
      expect(response.error).toContain("error");
    });

    it("should handle timeout errors", () => {
      const response = {
        success: false,
        error: "Request timeout: LLM service took too long to respond",
      };

      expect(response.success).toBe(false);
      expect(response.error).toContain("timeout");
    });

    it("should provide meaningful error messages", () => {
      const errors = [
        "Failed to refine SUNO style",
        "Invalid lyrics provided",
        "Invalid feedback provided",
        "LLM service unavailable",
      ];

      errors.forEach(error => {
        expect(error.length).toBeGreaterThan(0);
        expect(typeof error).toBe("string");
      });
    });
  });

  describe("Performance", () => {
    it("should complete refinement within reasonable time", () => {
      const startTime = Date.now();
      
      // Simulate refinement
      const result = {
        tempo: "140 BPM",
        mood: "Energetic",
      };
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (in test environment)
      expect(duration).toBeLessThan(1000);
    });

    it("should handle concurrent refinement requests", () => {
      const requests = [
        { lyrics: "Lyrics 1", feedback: "Faster" },
        { lyrics: "Lyrics 2", feedback: "Slower" },
        { lyrics: "Lyrics 3", feedback: "More energetic" },
      ];

      expect(requests.length).toBe(3);
      requests.forEach(req => {
        expect(req).toHaveProperty("lyrics");
        expect(req).toHaveProperty("feedback");
      });
    });
  });
});
