import { describe, expect, it } from "vitest";
import {
  assertAllowedServerUrl,
  buildSearchUrl,
  mapEverythingResponse
} from "../src/services/everythingHttpClient.js";
import { AppError } from "../src/utils/errorUtils.js";
import type { SearchRequest } from "../src/models/search.js";

const baseOptions = {
  matchCase: false,
  matchPath: false,
  regex: false,
  sort: "name" as const,
  ascending: true
};

function request(text: string, overrides: Partial<SearchRequest> = {}): SearchRequest {
  return {
    text,
    offset: 0,
    count: 100,
    options: baseOptions,
    ...overrides
  };
}

describe("buildSearchUrl", () => {
  it("encodes Japanese and spaces", () => {
    const url = buildSearchUrl("http://localhost:8080", request("テスト動画"));
    expect(url).toContain("search=");
    expect(decodeURIComponent(new URL(url).searchParams.get("search") ?? "")).toBe("テスト動画");
  });

  it("encodes sample file with space", () => {
    const url = buildSearchUrl("http://localhost:8080/", request("sample file"));
    expect(new URL(url).searchParams.get("search")).toBe("sample file");
  });

  it("encodes Everything search syntax", () => {
    const samples = [
      'ext:mp4 "sample video"',
      'path:"D:\\Movies"',
      "*.jpg",
      "regex:^sample.*\\.mp4$"
    ];

    for (const text of samples) {
      const url = buildSearchUrl("http://127.0.0.1:8080", request(text));
      expect(new URL(url).searchParams.get("search")).toBe(text);
    }
  });

  it("includes search options and columns", () => {
    const url = buildSearchUrl(
      "http://localhost:8080",
      request("abc", {
        offset: 100,
        count: 50,
        options: {
          matchCase: true,
          matchPath: true,
          regex: true,
          sort: "date_modified",
          ascending: false
        }
      })
    );
    const params = new URL(url).searchParams;
    expect(params.get("json")).toBe("1");
    expect(params.get("offset")).toBe("100");
    expect(params.get("count")).toBe("50");
    expect(params.get("path_column")).toBe("1");
    expect(params.get("size_column")).toBe("1");
    expect(params.get("date_modified_column")).toBe("1");
    expect(params.get("case")).toBe("1");
    expect(params.get("path")).toBe("1");
    expect(params.get("regex")).toBe("1");
    expect(params.get("sort")).toBe("date_modified");
    expect(params.get("ascending")).toBe("0");
  });

  it("rejects non-localhost hosts", () => {
    expect(() => assertAllowedServerUrl("http://192.168.1.1:8080")).toThrow(AppError);
    expect(() => assertAllowedServerUrl("https://localhost:8080")).toThrow(AppError);
    expect(() => assertAllowedServerUrl("http://user:password@localhost:8080")).toThrow(AppError);
  });
});

describe("mapEverythingResponse", () => {
  it("maps file and folder results", () => {
    const mapped = mapEverythingResponse({
      totalResults: 2,
      results: [
        { type: "file", name: "a.txt", path: "D:\\Docs", size: 10, date_modified: "2026-07-14" },
        { type: "folder", name: "Movies", path: "D:\\" }
      ]
    });
    expect(mapped.totalResults).toBe(2);
    expect(mapped.items[0]?.type).toBe("file");
    expect(mapped.items[0]?.fullPath).toBe("D:\\Docs\\a.txt");
    expect(mapped.items[1]?.type).toBe("folder");
  });

  it("throws on unexpected response", () => {
    expect(() => mapEverythingResponse({} as never)).toThrow(AppError);
  });
});
