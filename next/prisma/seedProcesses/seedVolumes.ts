import { TransactionClient } from "@/types/prisma";
import { ModelYear } from "../generated/client";
import { prismaOld } from "@/lib/prismaOld";

export const seedVolumes = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const oldVolumes = await prismaOld.organization_ldv_sales.findMany();

  for (const oldVolume of oldVolumes) {
    const newOrgId = mapOfOldOrgIdsToNewOrgIds[oldVolume.organization_id];
    if (!newOrgId) {
      throw new Error(
        `oldVolume with id ${oldVolume.id} has an unknown org id!`,
      );
    }
    const modelYearEnum =
      mapOfModelYearIdsToModelYearEnum[oldVolume.model_year_id];
    if (!modelYearEnum) {
      throw new Error(
        `oldVolume with id ${oldVolume.id} has an unknown model year id!`,
      );
    }
    const volume = oldVolume.ldv_sales;
    if (!oldVolume.is_supplied) {
      await tx.legacySalesVolume.create({
        data: {
          organizationId: newOrgId,
          modelYear: modelYearEnum,
          volume,
        },
      });
    } else {
      await tx.supplyVolume.create({
        data: {
          organizationId: newOrgId,
          modelYear: modelYearEnum,
          volume,
        },
      });
    }
  }
};
