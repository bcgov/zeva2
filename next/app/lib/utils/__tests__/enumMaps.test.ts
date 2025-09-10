import {
  getEnumsToStringsMap,
  getStringsToEnumsMap,
  lowerCaseAndCapitalize,
  modelYearsTransformer,
  statusTransformer,
} from "../enumMaps";

describe("enumMaps generic helpers", () => {
  const FakeEnum = { FOO_BAR: "FOO_BAR", HELLO: "HELLO" } as const;

  test("lowerCaseAndCapitalize works", () => {
    expect(lowerCaseAndCapitalize("HELLO")).toBe("Hello");
  });

  test("statusTransformer splits on underscore", () => {
    expect(statusTransformer("FOO_BAR")).toBe("Foo Bar");
  });

  test("modelYearsTransformer extracts numeric portion", () => {
    expect(modelYearsTransformer("MY_2024")).toBe("2024");
  });

  test("maps round-trip between strings and enums", () => {
    const toString = getEnumsToStringsMap(FakeEnum, statusTransformer);
    expect(toString[FakeEnum.FOO_BAR]).toBe("Foo Bar");
    const toEnum = getStringsToEnumsMap(FakeEnum, statusTransformer);
    expect(toEnum["Foo Bar"]).toBe(FakeEnum.FOO_BAR);
  });
});
