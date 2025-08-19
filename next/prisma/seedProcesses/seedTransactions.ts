import { prismaOld } from "@/lib/prismaOld";
import { TransactionClient } from "@/types/prisma";
import { Decimal } from "@prisma/client/runtime/client.js";
import {
  ModelYear,
  ReferenceType,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "../generated/client";

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
      const referenceTyepAndId = getReferenceTypeAndId(transaction.id);
      if (!newOrgId) {
        throw new Error(
          "credit transaction " + transaction.id + " with unknown org id!",
        );
      }
      if (
        transactionType === TransactionType.CREDIT &&
        referenceTyepAndId[0] === ReferenceType.OBLIGATION_REDUCTION
      ) {
        throw new Error(
          "credit transaction " +
            transaction.id +
            " associated with a MYR, but is not a reduction!",
        );
      }
      await tx.zevUnitTransaction.create({
        data: {
          type: transactionType,
          organizationId: newOrgId,
          referenceType: referenceTyepAndId[0],
          legacyReferenceId: referenceTyepAndId[1],
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
};
