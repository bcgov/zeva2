import { ModelYear } from "@/prisma/generated/enums";
import { zevModelKeyDelimiter } from "./constants";

export const getZevModelKey = (
  make: string,
  modelName: string,
  modelYear: ModelYear,
) => {
  const key = `${make}|${modelName}|${modelYear}`;
  let delimiterCount = 0;
  for (const char of key) {
    if (char === zevModelKeyDelimiter) {
      delimiterCount = delimiterCount + 1;
    }
  }
  if (delimiterCount !== 2) {
    throw new Error("Illegal ZEV Model Key!");
  }
  return key;
};
