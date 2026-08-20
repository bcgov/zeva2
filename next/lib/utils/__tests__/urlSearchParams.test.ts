import { describe, it, expect } from "@jest/globals";
import { getObject, getString, getLegalPairs } from "../urlSearchParams";

describe("getObject", () => {
  it("parses a delimited string into a key-value object", () => {
    expect(getObject("a|1||b|2")).toEqual({ a: "1", b: "2" });
  });

  it("returns an empty object for null input", () => {
    expect(getObject(null)).toEqual({});
  });

  it("ignores pairs that don't split into exactly two parts", () => {
    expect(getObject("a|1|2||b|2")).toEqual({ b: "2" });
  });
});

describe("getString", () => {
  it("serializes an object into the delimited string format", () => {
    expect(getString({ a: "1", b: "2" })).toBe("a|1||b|2");
  });

  it("returns an empty string for an empty object", () => {
    expect(getString({})).toBe("");
  });
});

describe("getObject / getString round trip", () => {
  it("round-trips a simple object", () => {
    const original = { a: "1", b: "2" };
    expect(getObject(getString(original))).toEqual(original);
  });
});

describe("getLegalPairs", () => {
  it("filters out keys or values containing the intra-pair delimiter", () => {
    const input = { a: "1", "b|c": "2", d: "3|4" };
    expect(getLegalPairs(input)).toEqual({ a: "1" });
  });

  it("returns all pairs unchanged when none are illegal", () => {
    const input = { a: "1", b: "2" };
    expect(getLegalPairs(input)).toEqual(input);
  });
});
