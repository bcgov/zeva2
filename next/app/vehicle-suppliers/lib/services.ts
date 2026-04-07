import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AddressType } from "@/prisma/generated/enums";
import { OrganizationAddressSparse } from "./data";

export const getOrganizationDetails = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== id) {
    // Only government users or users from the organization itself can view the details
    return null;
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id,
    },
    include: {
      organizationAddress: {
        select: {
          addressType: true,
          addressLines: true,
          city: true,
          state: true,
          postalCode: true,
          county: true,
          country: true,
          representative: true,
        },
        where: {
          expirationDate: null, // Only get current addresses
        },
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          roles: true,
        },
        where: {
          isActive: true, // Only get active users
        },
      },
      SupplyVolume: {
        select: {
          vehicleClass: true,
          modelYear: true,
          volume: true,
        },
        orderBy: [{ vehicleClass: "asc" }, { modelYear: "asc" }],
      },
      LegacySalesVolume: {
        select: {
          vehicleClass: true,
          modelYear: true,
          volume: true,
        },
        orderBy: [{ vehicleClass: "asc" }, { modelYear: "asc" }],
      },
    },
  });

  if (!organization) {
    return null; // Organization not found
  }

  const findAddress = (typeToFind: AddressType) => {
    const { addressType, ...address } =
      organization.organizationAddress.find(
        (item) => item.addressType === typeToFind,
      ) ?? {};
    if (!addressType) {
      return undefined; // No address found for this type
    }
    return address as OrganizationAddressSparse;
  };

  const { organizationAddress, ...rest } = organization;

  return {
    ...rest,
    serviceAddress: findAddress(AddressType.SERVICE),
    recordsAddress: findAddress(AddressType.RECORDS),
  };
};
