import { describe, expect, it } from "vitest";
import { calculatePageState } from "../src/utils/pagination.js";

describe("pagination", () => {
  it("calculates pages", () => {
    expect(calculatePageState(0, 100, 250)).toEqual({
      currentPage: 1,
      totalPages: 3,
      canGoPrev: false,
      canGoNext: true
    });
    expect(calculatePageState(100, 100, 250)).toEqual({
      currentPage: 2,
      totalPages: 3,
      canGoPrev: true,
      canGoNext: true
    });
    expect(calculatePageState(200, 100, 250)).toEqual({
      currentPage: 3,
      totalPages: 3,
      canGoPrev: true,
      canGoNext: false
    });
  });

  it("handles empty results", () => {
    expect(calculatePageState(0, 100, 0).totalPages).toBe(1);
  });
});
