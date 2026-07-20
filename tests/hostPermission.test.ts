import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALLOWED_PORTS,
  getServerPort,
  originsForPort
} from "../src/services/hostPermission.js";

describe("hostPermission", () => {
  it("treats 8080 as the default allowed port", () => {
    expect(DEFAULT_ALLOWED_PORTS.has(8080)).toBe(true);
    expect(DEFAULT_ALLOWED_PORTS.has(3000)).toBe(false);
  });

  it("reads the port from a server URL", () => {
    expect(getServerPort("http://localhost:8080")).toBe(8080);
    expect(getServerPort("http://127.0.0.1:9090/")).toBe(9090);
  });

  it("builds origin patterns for a port", () => {
    expect(originsForPort(9090)).toEqual([
      "http://localhost:9090/*",
      "http://127.0.0.1:9090/*"
    ]);
  });
});
