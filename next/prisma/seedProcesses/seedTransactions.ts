import { prismaOld } from "@/lib/prismaOld";
import { TransactionClient } from "@/types/prisma";
import { Decimal } from "../generated/client/runtime/library";
import {
  ModelYear,
  ReferenceType,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "../generated/client";
import { SupplierClass } from "@/app/lib/constants/complianceRatio";
import {
  ComplianceReduction,
  getComplianceRatioReductions,
} from "@/app/model-year-report/lib/utilsServer";
import { getComplianceDate } from "@/app/lib/utils/complianceYear";

export const seedTransactions = async (
  tx: TransactionClient,
  mapOfOldCreditClassIdsToZevClasses: Partial<Record<number, ZevClass>>,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const mapOfOldTransactionIdsToOldAgreementIds: Partial<
    Record<number, number>
  > = {};
  const agreementsTransactions =
    await prismaOld.credit_agreement_credit_transaction.findMany();
  agreementsTransactions.forEach((element) => {
    mapOfOldTransactionIdsToOldAgreementIds[element.credit_transaction_id] =
      element.credit_agreement_id;
  });

  const mapOfOldTransactionIdsToOldTransferIds: Partial<
    Record<number, number>
  > = {};
  const transfersTransactions =
    await prismaOld.credit_transfer_credit_transaction.findMany();
  transfersTransactions.forEach((element) => {
    mapOfOldTransactionIdsToOldTransferIds[element.credit_transaction_id] =
      element.credit_transfer_id;
  });

  const mapOfOldTransactionIdsToOldMYRIds: Partial<Record<number, number>> = {};
  const myrsTransactions =
    await prismaOld.model_year_report_credit_transaction.findMany();
  myrsTransactions.forEach((element) => {
    mapOfOldTransactionIdsToOldMYRIds[element.credit_transaction_id] =
      element.model_year_report_id;
  });

  const mapOfOldTransactionIdsToOldSalesSubmissionIds: Partial<
    Record<number, number>
  > = {};
  const submissionsTransactions =
    await prismaOld.sales_submission_credit_transaction.findMany();
  submissionsTransactions.forEach((element) => {
    mapOfOldTransactionIdsToOldSalesSubmissionIds[
      element.credit_transaction_id
    ] = element.sales_submission_id;
  });

  const getReferenceTypeAndId = (
    oldTransactionId: number,
  ): [ReferenceType, number] => {
    const agreementId =
      mapOfOldTransactionIdsToOldAgreementIds[oldTransactionId];
    const myrId = mapOfOldTransactionIdsToOldMYRIds[oldTransactionId];
    const submissionId =
      mapOfOldTransactionIdsToOldSalesSubmissionIds[oldTransactionId];
    if (agreementId) {
      return [ReferenceType.AGREEMENT, agreementId];
    }
    if (myrId) {
      return [ReferenceType.OBLIGATION_REDUCTION, myrId];
    }
    if (submissionId) {
      return [ReferenceType.SUPPLY_CREDITS, submissionId];
    }
    throw new Error(
      "credit transaction " +
        oldTransactionId +
        " with unknown reference type!",
    );
  };

  const creditTransactionsOld = await prismaOld.credit_transaction.findMany();
  for (const transaction of creditTransactionsOld) {
    let transactionType;
    let organizationId;
    const zevClass =
      mapOfOldCreditClassIdsToZevClasses[transaction.credit_class_id];
    const modelYear =
      mapOfModelYearIdsToModelYearEnum[transaction.model_year_id];
    if (!zevClass) {
      throw new Error(
        "credit transaction " + transaction.id + " with unknown credit class!",
      );
    }
    if (!modelYear) {
      throw new Error(
        "credit transaction " + transaction.id + " with unknown model year!",
      );
    }
    const totalValueOld = transaction.total_value;
    const numberOfUnits = totalValueOld.lessThan(new Decimal(0))
      ? totalValueOld.times(new Decimal(-1))
      : totalValueOld;
    if (transaction.credit_to_id && !transaction.debit_from_id) {
      transactionType = TransactionType.CREDIT;
      organizationId = transaction.credit_to_id;
    } else if (!transaction.credit_to_id && transaction.debit_from_id) {
      transactionType = TransactionType.DEBIT;
      organizationId = transaction.debit_from_id;
    }
    if (transactionType && organizationId) {
      const newOrgId = mapOfOldOrgIdsToNewOrgIds[organizationId];
      const referenceTypeAndId = getReferenceTypeAndId(transaction.id);
      if (!newOrgId) {
        throw new Error(
          "credit transaction " + transaction.id + " with unknown org id!",
        );
      }
      if (referenceTypeAndId[0] === ReferenceType.OBLIGATION_REDUCTION) {
        continue;
      }
      await tx.zevUnitTransaction.create({
        data: {
          type: transactionType,
          organizationId: newOrgId,
          referenceType: referenceTypeAndId[0],
          legacyReferenceId: referenceTypeAndId[1],
          numberOfUnits: numberOfUnits,
          zevClass: zevClass,
          vehicleClass: VehicleClass.REPORTABLE,
          modelYear: modelYear,
          timestamp: transaction.transaction_timestamp,
        },
      });
    } else if (transaction.credit_to_id && transaction.debit_from_id) {
      const newCreditToOrgId =
        mapOfOldOrgIdsToNewOrgIds[transaction.credit_to_id];
      const newDebitFromOrgId =
        mapOfOldOrgIdsToNewOrgIds[transaction.debit_from_id];
      const oldTransferId =
        mapOfOldTransactionIdsToOldTransferIds[transaction.id];
      if (!newCreditToOrgId) {
        throw new Error(
          "credit transaction " +
            transaction.id +
            " with unknown credit to id!",
        );
      }
      if (!newDebitFromOrgId) {
        throw new Error(
          "credit transaction " +
            transaction.id +
            " with unknown debit from id!",
        );
      }
      if (!oldTransferId) {
        throw new Error(
          "credit transaction " +
            transaction.id +
            " should be associated with a transfer, but none were found!",
        );
      }
      await tx.zevUnitTransaction.create({
        data: {
          type: TransactionType.CREDIT,
          organizationId: newCreditToOrgId,
          referenceType: ReferenceType.TRANSFER,
          legacyReferenceId: oldTransferId,
          numberOfUnits: numberOfUnits,
          zevClass: zevClass,
          vehicleClass: VehicleClass.REPORTABLE,
          modelYear: modelYear,
          timestamp: transaction.transaction_timestamp,
        },
      });
      await tx.zevUnitTransaction.create({
        data: {
          type: TransactionType.TRANSFER_AWAY,
          organizationId: newDebitFromOrgId,
          referenceType: ReferenceType.TRANSFER,
          legacyReferenceId: oldTransferId,
          numberOfUnits: numberOfUnits,
          zevClass: zevClass,
          vehicleClass: VehicleClass.REPORTABLE,
          modelYear: modelYear,
          timestamp: transaction.transaction_timestamp,
        },
      });
    }
  }

  const mapOfVolumes: Partial<
    Record<number, Partial<Record<ModelYear, number>>>
  > = {};
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
    const isSupplied = oldVolume.is_supplied;
    const volume = oldVolume.ldv_sales;
    if (
      (modelYearEnum < ModelYear.MY_2024 && !isSupplied) ||
      (modelYearEnum >= ModelYear.MY_2024 && isSupplied)
    ) {
      if (!mapOfVolumes[newOrgId]) {
        mapOfVolumes[newOrgId] = {};
      }
      if (mapOfVolumes[newOrgId][modelYearEnum] !== undefined) {
        throw new Error(
          `oldVolume with id ${oldVolume.id} is an inconsistent entry!`,
        );
      }
      mapOfVolumes[newOrgId][modelYearEnum] = volume;
    }
  }
  const oldMyrs = await prismaOld.model_year_report.findMany();
  for (const oldMyr of oldMyrs) {
    const status = oldMyr.validation_status;
    if (status === "ASSESSED" || status === "REASSESSED") {
      const newOrgId = mapOfOldOrgIdsToNewOrgIds[oldMyr.organization_id];
      if (!newOrgId) {
        throw new Error(`oldMyr with id ${oldMyr.id} has an unknown org id!`);
      }
      const modelYearEnum =
        mapOfModelYearIdsToModelYearEnum[oldMyr.model_year_id];
      if (!modelYearEnum) {
        throw new Error(
          `oldMyr with id ${oldMyr.id} has an unknown model year id!`,
        );
      }
      const supplierClass = oldMyr.supplier_class;
      if (!supplierClass || !["S", "M", "L"].includes(supplierClass)) {
        throw new Error(
          `oldMyr with id ${oldMyr.id} has an unknown supplier class!`,
        );
      }
      const modelYearsToVolumes = mapOfVolumes[newOrgId];
      if (!modelYearsToVolumes) {
        throw new Error(
          `oldMyr with id ${oldMyr.id} does not have an associated volume`,
        );
      }
      const volume = modelYearsToVolumes[modelYearEnum];
      if (volume === undefined) {
        throw new Error(
          `oldMyr with id ${oldMyr.id} does not have an associated volume`,
        );
      }
      let newSupplierClass: SupplierClass;
      if (supplierClass === "L") {
        newSupplierClass = "large volume supplier";
      } else if (supplierClass === "M") {
        newSupplierClass = "medium volume supplier";
      } else {
        newSupplierClass = "small volume supplier";
      }
      const reductions: ComplianceReduction[] = getComplianceRatioReductions(
        { [VehicleClass.REPORTABLE]: volume.toString() },
        modelYearEnum,
        newSupplierClass,
      );
      for (const reduction of reductions) {
        await tx.zevUnitTransaction.create({
          data: {
            type: TransactionType.DEBIT,
            organizationId: newOrgId,
            referenceType: ReferenceType.OBLIGATION_REDUCTION,
            legacyReferenceId: oldMyr.id,
            numberOfUnits: reduction.numberOfUnits,
            zevClass: reduction.zevClass,
            vehicleClass: VehicleClass.REPORTABLE,
            modelYear: modelYearEnum,
            timestamp: getComplianceDate(modelYearEnum),
          },
        });
      }
    }
  }
};
