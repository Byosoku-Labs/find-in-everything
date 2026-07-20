import { describe, expect, it } from "vitest";
import { getParentPath, isFolderType, joinPath } from "../src/utils/pathUtils.js";

describe("pathUtils", () => {
  it("joins Windows paths", () => {
    expect(joinPath("D:\\Movies", "sample.mp4")).toBe("D:\\Movies\\sample.mp4");
    expect(joinPath("D:\\Movies\\", "sample.mp4")).toBe("D:\\Movies\\sample.mp4");
  });

  it("detects folders", () => {
    expect(isFolderType("folder")).toBe(true);
    expect(isFolderType("Folder")).toBe(true);
    expect(isFolderType("file")).toBe(false);
  });

  it("gets parent path", () => {
    expect(getParentPath("D:\\Movies\\a.mp4")).toBe("D:\\Movies");
  });
});
