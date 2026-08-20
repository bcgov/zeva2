import { describe, it, expect } from "@jest/globals";
import { getNormalizedComment } from "../comment";

describe("getNormalizedComment", () => {
  it("trims surrounding whitespace", () => {
    expect(getNormalizedComment("  hello  ")).toBe("hello");
  });

  it("returns undefined for an empty or whitespace-only comment", () => {
    expect(getNormalizedComment("")).toBeUndefined();
    expect(getNormalizedComment("   ")).toBeUndefined();
  });

  it("returns the comment unchanged if there is no surrounding whitespace", () => {
    expect(getNormalizedComment("hello")).toBe("hello");
  });
});
