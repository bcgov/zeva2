import { ModelYear, AddressType } from "@/prisma/generated/client";

export const getModelYearEnum = (modelYear?: string | number) => {
  if (modelYear) {
    return ModelYear[("MY_" + modelYear) as keyof typeof ModelYear];
  }
  return undefined;
};

// for filtering
export const getEnumOr = (
  key: string,
  matches: string[],
  isEnum: (s: string) => boolean,
) => {
  const result: any[] = [];
  if (matches.length > 0) {
    for (const match of matches) {
      if (isEnum(match)) {
        result.push({ [key]: match });
      }
    }
  } else {
    result.push({ id: -1 });
  }
  return result;
};

export const getAddressTypeEnum = (addressType: string) => {
  const addressTypeUpper = addressType.toUpperCase();
  if (!(addressTypeUpper in AddressType)) {
    throw new Error(`Invalid address type: ${addressType}`);
  }
  return AddressType[addressTypeUpper as keyof typeof AddressType];
};
