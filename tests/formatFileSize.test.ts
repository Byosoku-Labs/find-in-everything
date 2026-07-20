import { describe, expect, it } from "vitest";
import { formatFileSize } from "../src/utils/formatFileSize.js";

describe("formatFileSize", () => {
  it("formats common sizes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024)).toBe("1.00 KB");
    expect(formatFileSize(1048576)).toBe("1.00 MB");
    expect(formatFileSize(1073741824)).toBe("1.00 GB");
    expect(formatFileSize(1099511627776)).toBe("1.00 TB");
  });

  it("handles missing values", () => {
    expect(formatFileSize(undefined)).toBe("-");
  });
});
