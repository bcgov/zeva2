import { enumToTitleString, modelYearEnumToInt } from "../convertEnums";
import { ModelYear } from "@/prisma/generated/client";

describe("convertEnums", () => {
  test("modelYearEnumToInt converts MY_2024 to 2024", () => {
    expect(modelYearEnumToInt(ModelYear.MY_2024 as unknown as any)).toBe(2024);
  });

  test("enumToTitleString converts snake_case to Title Case", () => {
    expect(enumToTitleString("FOO_BAR_BAZ")).toBe("Foo Bar Baz");
    expect(enumToTitleString("SINGLE")).toBe("Single");
  });
});
