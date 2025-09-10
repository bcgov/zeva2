import { cleanupStringData } from "../dataCleanup";

describe("dataCleanup.cleanupStringData", () => {
  test("returns null for null/empty/whitespace", () => {
    expect(cleanupStringData(null)).toBeNull();
    expect(cleanupStringData(" ")).toBeNull();
    expect(cleanupStringData("\n\t")).toBeNull();
  });

  test("trims non-empty strings", () => {
    expect(cleanupStringData("  hello  ")).toBe("hello");
  });
});

