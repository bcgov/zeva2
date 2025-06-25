import { PrismaClient } from "@prisma/client";
import { prismaOld } from "@/lib/prismaOld";
import { ModelYear } from "../generated/client";
import {
  cleanupStringData,
  isEmptyAddress,
} from "@/app/organizations/lib/utils";
import { getAddressTypeEnum } from "@/lib/utils/getEnums";

const seedOrganizations = async (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$use" | "$on" | "$transaction" | "$extends"
  >,
  mapOfModelYearIdsToModelYearEnum: {
    [id: number]: ModelYear | undefined;
  },
) => {
  const mapOfOldOrgIdsToNewOrgIds: { [id: number]: number | undefined } = {};

  // add orgs:
  const orgsOld = await prismaOld.organization.findMany();
  for (const orgOld of orgsOld) {
    const orgNew = await tx.organization.create({
      data: {
        name: orgOld.organization_name,
        firstModelYear:
          mapOfModelYearIdsToModelYearEnum[orgOld.first_model_year_id ?? -1],
        isGovernment: orgOld.is_government,
        isActive: orgOld.is_active,
        shortName: orgOld.short_name,
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

  // add orgs LDV supplied volumes (from old LDV sales table):
  const orgLDVSalesOld = await prismaOld.organization_ldv_sales.findMany({
    where: { is_supplied: true },
  });
  for (const orgLDVSaleOld of orgLDVSalesOld) {
    const orgIdNew = mapOfOldOrgIdsToNewOrgIds[orgLDVSaleOld.organization_id];
    if (!orgIdNew) {
      throw new Error(
        "organization_ldv_sales " +
          orgLDVSaleOld.id +
          " with unknown organization id!",
      );
    }
    await tx.organizationLDVSupplied.create({
      data: {
        organizationId: orgIdNew,
        modelYear:
          mapOfModelYearIdsToModelYearEnum[orgLDVSaleOld.model_year_id] ??
          ModelYear.MY_2019,
        volume: orgLDVSaleOld.ldv_sales,
      },
    });
  }

  return {
    mapOfOldOrgIdsToNewOrgIds,
  };
};

export default seedOrganizations;
