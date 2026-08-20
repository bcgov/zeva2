import { describe, it, expect } from "@jest/globals";
import { Role } from "@/prisma/generated/enums";
import {
  getMatchingTerms,
  lowerCaseAndCapitalize,
  statusTransformer,
  modelYearsTransformer,
  idpTransformer,
  roleTransformer,
  getStringsToEnumsMap,
  getEnumsToStringsMap,
} from "../enumMaps";

describe("getMatchingTerms", () => {
  it("returns values whose keys contain the search term, case/space insensitive", () => {
    const map = { "Model Year": "MODEL_YEAR", Status: "STATUS" };
    expect(getMatchingTerms(map, "modelyear")).toEqual(["MODEL_YEAR"]);
    expect(getMatchingTerms(map, "xyz")).toEqual([]);
  });

  it("ignores entries with falsy values", () => {
    const map = { Foo: undefined, Bar: "BAR" };
    expect(getMatchingTerms(map, "a")).toEqual(["BAR"]);
  });
});

describe("lowerCaseAndCapitalize", () => {
  it("capitalizes the first letter and lower-cases the rest", () => {
    expect(lowerCaseAndCapitalize("HELLO")).toBe("Hello");
    expect(lowerCaseAndCapitalize("hELLO")).toBe("Hello");
  });
});

describe("statusTransformer", () => {
  it("splits on underscores, capitalizes each word, and joins with spaces", () => {
    expect(statusTransformer("IN_PROGRESS")).toBe("In Progress");
  });
});

describe("modelYearsTransformer", () => {
  it("returns the year portion after the underscore", () => {
    expect(modelYearsTransformer("MY_2024")).toBe("2024");
  });
});

describe("idpTransformer", () => {
  it("lower-cases and strips underscores", () => {
    expect(idpTransformer("AZURE_IDIR")).toBe("azureidir");
  });
});

describe("roleTransformer", () => {
  it("returns special-cased labels for known ZEVA roles", () => {
    expect(roleTransformer(Role.ZEVA_IDIR_USER)).toBe("ZEVA IDIR User");
    expect(roleTransformer(Role.ZEVA_IDIR_USER_READ_ONLY)).toBe(
      "ZEVA IDIR User (read-only)",
    );
    expect(roleTransformer(Role.ZEVA_BCEID_USER)).toBe("ZEVA BCeID User");
  });

  it("falls back to statusTransformer for other roles", () => {
    expect(roleTransformer(Role.DIRECTOR)).toBe("Director");
  });
});

describe("getStringsToEnumsMap / getEnumsToStringsMap", () => {
  it("build maps in both directions using the provided transformer", () => {
    const enumObj = { A: "FOO_BAR" } as Record<string, string>;
    const toEnums = getStringsToEnumsMap(enumObj, statusTransformer);
    expect(toEnums["Foo Bar"]).toBe("FOO_BAR");

    const toStrings = getEnumsToStringsMap(enumObj, statusTransformer);
    expect(toStrings["FOO_BAR"]).toBe("Foo Bar");
  });
});
