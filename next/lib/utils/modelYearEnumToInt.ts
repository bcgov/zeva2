import { ModelYear } from "@/prisma/generated/client";

/**
 * This function is used to convert a ModelYear enum value to the actual year as a number
 * @param yearEnum - The ModelYear enum value to convert.
 * @returns The year as an integer of the model year.
 */
const modelYearEnumToInt = (yearEnum: ModelYear) => {
  const year = yearEnum.toString().substring(3);
  return parseInt(year);
};

export default modelYearEnumToInt;