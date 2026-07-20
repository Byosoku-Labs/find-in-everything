import { describe, expect, it, vi, afterEach } from "vitest";
import { EverythingHttpClient } from "../src/services/everythingHttpClient.js";
import { AppError } from "../src/utils/errorUtils.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("EverythingHttpClient errors", () => {
  it("maps timeout via AbortController", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    const client = new EverythingHttpClient("http://localhost:8080", 20);
    await expect(
      client.search({
        text: "x",
        offset: 0,
        count: 10,
        options: {
          matchCase: false,
          matchPath: false,
          regex: false,
          sort: "name",
          ascending: true
        }
      })
    ).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("maps invalid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("bad json");
        }
      }))
    );

    const client = new EverythingHttpClient("http://localhost:8080", 5000);
    await expect(
      client.search({
        text: "x",
        offset: 0,
        count: 10,
        options: {
          matchCase: false,
          matchPath: false,
          regex: false,
          sort: "name",
          ascending: true
        }
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("maps unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({})
      }))
    );

    const client = new EverythingHttpClient("http://localhost:8080", 5000);
    await expect(
      client.search({
        text: "x",
        offset: 0,
        count: 10,
        options: {
          matchCase: false,
          matchPath: false,
          regex: false,
          sort: "name",
          ascending: true
        }
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
