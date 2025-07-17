/*
 * This process seeds the Initiative and Purchase Agreements from Old Database.
 * This is for local development/testing only.
 * Seeding Agreement data is not required for production.
*/

import { prismaOld } from "@/lib/prismaOld";
import { TransactionClient } from "@/types/prisma";
import { Decimal } from "@prisma/client/runtime/client.js";
import {
  ModelYear,
  ZevClass,
  AgreementType,
  AgreementStatus,
} from "../generated/client";

const mapAgreementType = (old: string): AgreementType | undefined => {
  switch (old) {
    case "Initiative Agreement":
      return AgreementType.INITIATIVE;
    case "Purchase Agreement":
      return AgreementType.PURCHASE;
    default:
      return undefined;
  }
};

const mapAgreementStatus = (old: string): AgreementStatus => {
  switch (old) {
    case "DRAFT":
      return AgreementStatus.DRAFT;
    case "RECOMMENDED":
      return AgreementStatus.RECOMMEND_APPROVAL;
    case "RETURNED":
      return AgreementStatus.RETURNED_TO_ANALYST;
    case "ISSUED":
      return AgreementStatus.ISSUED;
    case "DELETED":
      return AgreementStatus.DELETED;
    default:
      throw new Error(`Unknown agreement status: ${old}`);
  }
};

export const seedAgreements = async (
  tx: TransactionClient,
  mapOfOldCreditClassIdsToZevClasses: Partial<Record<number, ZevClass>>,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const mapOfOldAgreementIdsToNewAgreementIds: Partial<
    Record<number, number>
  > = {};
  
  /*** Transfer data from credit_agreement table to Agreement model ***/
  const oldAgreements = await prismaOld.credit_agreement.findMany();
  const oldComments = await prismaOld.credit_agreement_comment.findMany({
    where: { to_director: false }, // Only comments to supplier
  });
  for (const oldAgreement of oldAgreements) {
    const agreementType = mapAgreementType(oldAgreement.transaction_type);
    if (!agreementType) {
      continue; // Skip invalid agreement types
    }
    const organizationId = mapOfOldOrgIdsToNewOrgIds[oldAgreement.organization_id];
    if (!organizationId) {
      throw new Error(
        `Organization ID ${oldAgreement.organization_id} not found in new mapping`
      );
    }
    const status = mapAgreementStatus(oldAgreement.status);
    const comment = oldComments.findLast(
      rec => rec.credit_agreement_id === oldAgreement.id
    )?.comment;

    const newAgreement = await tx.agreement.create({
      data: {
        referenceId: oldAgreement.optional_agreement_id,
        organizationId: organizationId ?? 0,
        agreementType,
        status,
        effectiveDate: oldAgreement.effective_date,
        comment,
      },
    });

    mapOfOldAgreementIdsToNewAgreementIds[oldAgreement.id] = newAgreement.id;
  }

  /*** Transfer data from credit_agreement_content table to AgreementContent model ***/
  const oldAgreementContents = await prismaOld.credit_agreement_content.findMany();
  for (const oldContent of oldAgreementContents) {
    const newAgreementId = mapOfOldAgreementIdsToNewAgreementIds[oldContent.credit_agreement_id];
    if (!newAgreementId) {
      continue; // Skip if the agreement ID is not found in the new mapping
    }
    const zevClass = mapOfOldCreditClassIdsToZevClasses[oldContent.credit_class_id];
    if (!zevClass) {
      throw new Error(
        `ZEV Class not found for credit class ID ${oldContent.credit_class_id}`
      );
    }
    const modelYear = mapOfModelYearIdsToModelYearEnum[oldContent.model_year_id];
    if (!modelYear) {
      throw new Error(
        `Model Year not found for model year ID ${oldContent.model_year_id}`
      );
    }
    const numberOfUnits = oldContent.number_of_credits;

    await tx.agreementContent.create({
      data: {
        agreementId: newAgreementId,
        zevClass,
        modelYear,
        numberOfUnits: new Decimal(numberOfUnits),
      },
    });
  }

  // The rest of the tables are not being seeded in this process.

  return {
    mapOfOldAgreementIdsToNewAgreementIds,
  }
};
