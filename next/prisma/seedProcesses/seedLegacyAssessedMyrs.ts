import { TransactionClient } from "@/types/prisma";
import { ModelYear } from "../generated/client";
import { prismaOld } from "@/lib/prismaOld";

export const seedLegacyAssessedMyrs = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const oldAssessedMyrs = await prismaOld.model_year_report.findMany({
    where: {
      OR: [
        { validation_status: "ASSESSED" },
        { validation_status: "REASSESSED" },
      ],
    },
  });
  for (const myr of oldAssessedMyrs) {
    const newOrgId = mapOfOldOrgIdsToNewOrgIds[myr.organization_id];
    if (!newOrgId) {
      throw new Error(
        `old assessed myr with id ${myr.id} has an unknown org id!`,
      );
    }
    const modelYearEnum = mapOfModelYearIdsToModelYearEnum[myr.model_year_id];
    if (!modelYearEnum) {
      throw new Error(
        `old assessed myr with id ${myr.id} has an unknown model year id!`,
      );
    }
    await tx.legacyAssessedModelYearReport.create({
      data: {
        organizationId: newOrgId,
        modelYear: modelYearEnum,
      },
    });
  }
};
