import { OrganizationAddressSparse } from "./data";
import { cleanupStringData } from "@/lib/utils/dataCleanup";

export const cleanupAddressData = (address?: OrganizationAddressSparse) => {
  if (!address) {
    return undefined;
  }
  const cleanedAddress: OrganizationAddressSparse = { ...address };
  for (const key in cleanedAddress) {
    cleanedAddress[key as keyof OrganizationAddressSparse] = cleanupStringData(
      cleanedAddress[key as keyof OrganizationAddressSparse],
    );
  }
  return cleanedAddress;
};

export const isEmptyAddress = (address: OrganizationAddressSparse) => {
  for (const value of Object.values(address)) {
    if (value && value.trim().length > 0) {
      return false; // At least one field is not empty
    }
  }
  return true; // All fields are empty
};
