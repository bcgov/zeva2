import { TransactionClient } from "@/types/prisma";
import { prismaOld } from "@/lib/prismaOld";
import { isEmptyAddress } from "@/app/organizations/lib/utils";
import { getAddressTypeEnum } from "@/lib/utils/getEnums";
import { cleanupStringData } from "@/lib/utils/dataCleanup";

export const seedOrganizations = async (tx: TransactionClient) => {
  const mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>> = {};

  // add orgs:
  const orgsOld = await prismaOld.organization.findMany();
  for (const orgOld of orgsOld) {
    const orgNew = await tx.organization.create({
      data: {
        name: orgOld.organization_name,
        isGovernment: orgOld.is_government,
        isActive: orgOld.is_active,
        shortName: orgOld.short_name ?? orgOld.organization_name,
      },
    });
    mapOfOldOrgIdsToNewOrgIds[orgOld.id] = orgNew.id;
  }

  // add orgs addresses:
  const orgAddressesOld = await prismaOld.organization_address.findMany({
    include: {
      address_type: {
        select: {
          address_type: true,
        },
      },
    },
  });

  for (const orgAddressOld of orgAddressesOld) {
    const orgIdNew = mapOfOldOrgIdsToNewOrgIds[orgAddressOld.organization_id];
    if (!orgIdNew) {
      throw new Error(
        "organization_address " +
          orgAddressOld.id +
          " with unknown organization id!",
      );
    }

    const addressLinesOld = [
      orgAddressOld.address_line_1,
      orgAddressOld.address_line_2,
      orgAddressOld.address_line_3,
    ].filter((line) => line && line.trim() !== "");

    const newAddressSparse = {
      addressLines: cleanupStringData(addressLinesOld.join("\n")),
      city: cleanupStringData(orgAddressOld.city),
      postalCode: cleanupStringData(orgAddressOld.postal_code),
      state: cleanupStringData(orgAddressOld.state),
      county: cleanupStringData(orgAddressOld.county),
      country: cleanupStringData(orgAddressOld.country),
      representative: cleanupStringData(orgAddressOld.representative_name),
    };

    // Create the address record only if it has non-empty fields
    if (!isEmptyAddress(newAddressSparse)) {
      await tx.organizationAddress.create({
        data: {
          organizationId: orgIdNew,
          expirationDate: orgAddressOld.expiration_date,
          addressType: getAddressTypeEnum(
            orgAddressOld.address_type.address_type,
          ),
          ...newAddressSparse,
        },
      });
    }
  }

  return mapOfOldOrgIdsToNewOrgIds;
};
