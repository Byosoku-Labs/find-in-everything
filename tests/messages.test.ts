import { describe, expect, it } from "vitest";
import { isExtensionRequest } from "../src/models/messages.js";

const validOptions = {
  matchCase: false,
  matchPath: false,
  regex: false,
  sort: "name",
  ascending: true
} as const;

describe("isExtensionRequest", () => {
  it("accepts a bounded, feature-specific search request", () => {
    expect(
      isExtensionRequest({
        type: "SEARCH_EVERYTHING",
        query: "report.pdf",
        offset: 0,
        count: 100,
        options: validOptions
      })
    ).toBe(true);
  });

  it("rejects arbitrary network-operation messages", () => {
    expect(
      isExtensionRequest({
        type: "FETCH",
        url: "http://localhost:9222/json",
        method: "GET"
      })
    ).toBe(false);
  });

  it("rejects out-of-range searches and invalid options", () => {
    expect(
      isExtensionRequest({
        type: "SEARCH_EVERYTHING",
        query: "x".repeat(501),
        offset: -1,
        count: 1001,
        options: { ...validOptions, sort: "arbitrary" }
      })
    ).toBe(false);
  });
});
