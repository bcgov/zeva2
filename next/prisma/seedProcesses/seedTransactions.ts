import { prismaOld } from "@/lib/prismaOld";
import { TransactionClient } from "@/types/prisma";
import { Decimal } from "../generated/client/runtime/library";
import {
  ModelYear,
  ReferenceType,
  SupplierClass,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "../generated/client";
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
  const agreementTransactions =
    await prismaOld.credit_agreement_credit_transaction.findMany();
  for (const element of agreementTransactions) {
    mapOfOldTransactionIdsToOldAgreementIds[element.credit_transaction_id] =
      element.credit_agreement_id;
  }

  const mapOfOldTransactionIdsToOldTransferIds: Partial<
    Record<number, number>
  > = {};
  const transferTransactions =
    await prismaOld.credit_transfer_credit_transaction.findMany();
  for (const element of transferTransactions) {
    mapOfOldTransactionIdsToOldTransferIds[element.credit_transaction_id] =
      element.credit_transfer_id;
  }

  const mapOfOldTransactionIdsToOldMYRIds: Partial<Record<number, number>> = {};
  const myrTransactions =
    await prismaOld.model_year_report_credit_transaction.findMany();
  for (const element of myrTransactions) {
    mapOfOldTransactionIdsToOldMYRIds[element.credit_transaction_id] =
      element.model_year_report_id;
  }

  const mapOfOldTransactionIdsToOldSalesSubmissionIds: Partial<
    Record<number, number>
  > = {};
  const submissionTransactions =
    await prismaOld.sales_submission_credit_transaction.findMany();
  for (const element of submissionTransactions) {
    mapOfOldTransactionIdsToOldSalesSubmissionIds[
      element.credit_transaction_id
    ] = element.sales_submission_id;
  }

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
      return [ReferenceType.COMPLIANCE_RATIO_REDUCTION, myrId];
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
    let zevClass =
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
    const isNegative = totalValueOld.lessThan(new Decimal(0));
    const numberOfUnits = isNegative
      ? totalValueOld.times(new Decimal(-1))
      : totalValueOld;
    
    if (transaction.credit_to_id && !transaction.debit_from_id) {
      transactionType = TransactionType.CREDIT;
      organizationId = transaction.credit_to_id;
    } else if (!transaction.credit_to_id && transaction.debit_from_id) {
      if (isNegative) {
        transactionType = TransactionType.CREDIT;
      } else {
        transactionType = TransactionType.DEBIT;
      }
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
      // Keep compliance ratio reductions from original data instead of recalculating
      // if (referenceTypeAndId[0] === ReferenceType.COMPLIANCE_RATIO_REDUCTION) {
      //   continue;
      // }
      if (
        referenceTypeAndId[0] === ReferenceType.AGREEMENT &&
        transactionType === TransactionType.DEBIT &&
        zevClass === ZevClass.B
      ) {
        zevClass = ZevClass.UNSPECIFIED;
      }
      await tx.zevUnitTransaction.create({
        data: {
          type: transactionType,
          organizationId: newOrgId,
          referenceType: referenceTypeAndId[0],
          legacyReferenceId: referenceTypeAndId[1],
          numberOfUnits,
          zevClass,
          vehicleClass: VehicleClass.REPORTABLE,
          modelYear,
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

  // COMMENTED OUT: Recalculation logic - Using original data from credit_transaction instead (For Testing. I assume this is on purpose)
  /*
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
        newSupplierClass = SupplierClass.LARGE_VOLUME_SUPPLIER;
      } else if (supplierClass === "M") {
        newSupplierClass = SupplierClass.MEDIUM_VOLUME_SUPPLIER;
      } else {
        newSupplierClass = SupplierClass.SMALL_VOLUME_SUPPLIER;
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
            referenceType: ReferenceType.COMPLIANCE_RATIO_REDUCTION,
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
  */
};
