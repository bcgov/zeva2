import { ModelYear } from "@/prisma/generated/client";

/**
 * Converts a ModelYear enum value to the actual year as a number
 * @param yearEnum - The ModelYear enum value to convert.
 * @returns The year as an integer of the model year.
 */
export const modelYearEnumToInt = (yearEnum: ModelYear) => {
  const year = yearEnum.toString().substring(3);
  return parseInt(year);
};

/**
 * Converts an enum value to a title case string.
 * @param enumValue - The enum value to convert.
 * @returns The enum value as a title case string.
 */
export const enumToTitleString = (enumValue: string) => {
  const words = enumValue
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return words.join(" ");
};
