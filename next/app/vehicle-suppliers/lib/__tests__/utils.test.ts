import { describe, it, expect } from "@jest/globals";
import { cleanupAddressData, isEmptyAddress } from "../utils";
import { cleanupStringData } from "@/lib/utils/dataCleanup";

describe("Organization utils: cleanupStringData", () => {
  it("returns null for null or empty string", () => {
    expect(cleanupStringData(null)).toBeNull();
    expect(cleanupStringData("")).toBeNull();
    expect(cleanupStringData("   ")).toBeNull();
  });

  it("trims and returns string if not empty", () => {
    expect(cleanupStringData("  hello  ")).toBe("hello");
  });
});

describe("Organization utils: cleanupAddressData", () => {
  it("cleans up each string field", () => {
    const testAddress = {
      addressLines: "1234 Kingsway\n  ",
      city: " Burnaby",
      postalCode: "  ",
      country: "Canada",
      state: "BC",
      county: null,
      representative: "",
    };

    const cleaned = cleanupAddressData(testAddress);
    expect(cleaned).toEqual({
      addressLines: "1234 Kingsway",
      city: "Burnaby",
      postalCode: null,
      country: "Canada",
      state: "BC",
      county: null,
      representative: null,
    });
  });

  it("returns undefined if address is undefined", () => {
    expect(cleanupAddressData()).toBeUndefined();
  });
});

describe("Organization utils: isEmptyAddress", () => {
  it("returns true if all fields are empty or whitespace", () => {
    const testAddress = {
      addressLines: "  ",
      city: "",
      postalCode: "",
      country: null,
      state: " ",
      county: null,
      representative: "",
    };
    expect(isEmptyAddress(testAddress)).toBe(true);
  });

  it("returns false if any field is non-empty", () => {
    const testAddress = {
      addressLines: null,
      city: null,
      postalCode: "",
      country: null,
      state: "BC",
      county: null,
      representative: "",
    };
    expect(isEmptyAddress(testAddress)).toBe(false);
  });
});
