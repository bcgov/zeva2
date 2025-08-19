import { AddressType } from "@/prisma/generated/client";

export const getAddressTypeEnum = (addressType: string) => {
  const addressTypeUpper = addressType.toUpperCase();
  if (!(addressTypeUpper in AddressType)) {
    throw new Error(`Invalid address type: ${addressType}`);
  }
  return AddressType[addressTypeUpper as keyof typeof AddressType];
};
