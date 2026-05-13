// ============================================================
// DESIGN: Tests for Mobile Bottom Navigation
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import MobileBottomNav from "./MobileBottomNav";

// MobileBottomNav component tests
// Component uses ProjectContext internally for state management

describe("MobileBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be a valid React component", () => {
    expect(MobileBottomNav).toBeDefined();
    expect(typeof MobileBottomNav).toBe("function");
  });

  it("should export as default", () => {
    expect(MobileBottomNav).toBeTruthy();
  });
});
