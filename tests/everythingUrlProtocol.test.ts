import { describe, expect, it } from "vitest";
import { createEverythingUrl } from "../src/services/everythingUrlProtocol.js";

describe("createEverythingUrl", () => {
  it("encodes search text and options", () => {
    const url = createEverythingUrl("sample file", {
      matchCase: false,
      matchPath: false,
      regex: false,
      sort: "date_modified",
      ascending: false
    });

    expect(url.startsWith("es:")).toBe(true);
    expect(url).toContain(encodeURIComponent("sample file"));
    expect(url).toContain("sort=date-modified");
    expect(url).toContain("ascending=0");
    expect(url).toContain("case=0");
    expect(url).toContain("path=0");
    expect(url).toContain("regex=0");
  });

  it("encodes Japanese and Everything syntax", () => {
    const samples = [
      "テスト動画",
      'ext:mp4 "sample video"',
      'path:"D:\\Movies"',
      "*.jpg",
      "regex:^sample.*\\.mp4$"
    ];

    for (const text of samples) {
      const url = createEverythingUrl(text, {
        matchCase: true,
        matchPath: true,
        regex: true,
        sort: "name",
        ascending: true
      });
      expect(url).toContain(encodeURIComponent(text));
      expect(url).toContain("case=1");
      expect(url).toContain("path=1");
      expect(url).toContain("regex=1");
    }
  });
});
