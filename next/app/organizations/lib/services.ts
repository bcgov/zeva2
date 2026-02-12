import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AddressType,
  SupplierClass,
  VehicleClass,
} from "@/prisma/generated/client";
import { OrganizationAddressSparse } from "./data";
import { getCurrentComplianceYear } from "@/app/lib/utils/complianceYear";
import { getPrevSupplierVolumes } from "@/app/lib/services/volumes";
import { Decimal } from "@/prisma/generated/client/runtime/library";

export const getSupplierClassesMap = async (organizationId?: number) => {
  const result: Partial<Record<number, SupplierClass>> = {};
  const complianceYear = getCurrentComplianceYear();
  const { volumes } = await getPrevSupplierVolumes(
    VehicleClass.REPORTABLE,
    complianceYear,
    organizationId,
  );
  const orgIdsToVolumesMap: Partial<Record<number, [number, number[]]>> = {};
  for (const volume of volumes) {
    const orgId = volume.organizationId;
    if (!orgIdsToVolumesMap[orgId]) {
      orgIdsToVolumesMap[orgId] = [orgId, []];
    }
    orgIdsToVolumesMap[orgId][1].push(volume.volume);
  }
  for (const value of Object.values(orgIdsToVolumesMap)) {
    if (value) {
      const orgId = value[0];
      const volumes = value[1];
      if (volumes.length === 3) {
        const total = volumes.reduce((acc, cv) => {
          return acc + cv;
        }, 0);
        const average = new Decimal(total).div(3);
        if (average.lt(1000)) {
          result[orgId] = SupplierClass.SMALL_VOLUME_SUPPLIER;
        } else if (average.gte(1000) && average.lt(5000)) {
          result[orgId] = SupplierClass.MEDIUM_VOLUME_SUPPLIER;
        } else {
          result[orgId] = SupplierClass.LARGE_VOLUME_SUPPLIER;
        }
      }
    }
  }
  return result;
};

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
