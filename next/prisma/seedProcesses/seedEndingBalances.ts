import { prismaOld } from "@/lib/prismaOld";
import {
  BalanceType,
  ModelYear,
  VehicleClass,
  ZevClass,
} from "../generated/client";
import { Decimal } from "../generated/client/runtime/library";
import { TransactionClient } from "@/types/prisma";

const isAllZero = (
  balances: {
    credit_a_value: Decimal | null;
    credit_b_value: Decimal | null;
  }[],
): boolean => {
  for (const balance of balances) {
    const aValue = balance.credit_a_value;
    const bValue = balance.credit_b_value;
    if (aValue && !aValue.equals(0)) {
      return false;
    }
    if (bValue && !bValue.equals(0)) {
      return false;
    }
  }
  return true;
};

const createEndingBalance = async (
  tx: TransactionClient,
  organizationId: number,
  complianceYear: ModelYear,
  balanceType: BalanceType,
  initialNumberOfUnits: Decimal,
  finalNumberOfUnits: Decimal,
  zevClass: ZevClass,
  vehicleClass: VehicleClass,
  modelYear: ModelYear,
) => {
  await tx.zevUnitEndingBalance.create({
    data: {
      organizationId,
      complianceYear,
      type: balanceType,
      initialNumberOfUnits,
      finalNumberOfUnits,
      zevClass,
      vehicleClass,
      modelYear,
    },
  });
};

export const seedEndingBalances = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const creditCategory = "ProvisionalBalanceAfterCreditReduction";
  const debitCategory = "CreditDeficit";
  const oldMyrIdsWithReassessments: number[] = [];

  const reassessments = await prismaOld.supplemental_report.findMany({
    include: {
      model_year_report: {
        select: {
          id: true,
          organization_id: true,
          model_year_id: true,
        },
      },
      supplemental_report_credit_activity: {
        select: {
          id: true,
          model_year_id: true,
          credit_a_value: true,
          credit_b_value: true,
          category: true,
        },
      },
    },
  });
  const referredToIds: number[] = [];
  for (const reassessment of reassessments) {
    const suppId = reassessment.supplemental_id;
    if (suppId) {
      referredToIds.push(suppId);
    }
  }
  const filteredReassessments = reassessments.filter(
    (reassessment) =>
      !referredToIds.includes(reassessment.id) &&
      (reassessment.status === "ASSESSED" ||
        reassessment.status === "REASSESSED"),
  );
  for (const reassessment of filteredReassessments) {
    oldMyrIdsWithReassessments.push(reassessment.model_year_report.id);
    const newOrgId =
      mapOfOldOrgIdsToNewOrgIds[reassessment.model_year_report.organization_id];
    if (!newOrgId) {
      throw new Error(
        `reassessment with id ${reassessment.id} has a MYR with an unknown org id!`,
      );
    }
    const complianceYear =
      mapOfModelYearIdsToModelYearEnum[
        reassessment.model_year_report.model_year_id
      ];
    if (!complianceYear) {
      throw new Error(
        `reassessment with id ${reassessment.id} has a MYR with an unknown model year id!`,
      );
    }
    const filteredBalances =
      reassessment.supplemental_report_credit_activity.filter(
        (balance) =>
          balance.category === creditCategory ||
          balance.category === debitCategory,
      );
    const allZero = isAllZero(filteredBalances);
    if (allZero) {
      await createEndingBalance(
        tx,
        newOrgId,
        complianceYear,
        BalanceType.CREDIT,
        new Decimal(0),
        new Decimal(0),
        ZevClass.A,
        VehicleClass.REPORTABLE,
        complianceYear,
      );
      await createEndingBalance(
        tx,
        newOrgId,
        complianceYear,
        BalanceType.CREDIT,
        new Decimal(0),
        new Decimal(0),
        ZevClass.B,
        VehicleClass.REPORTABLE,
        complianceYear,
      );
      continue;
    }
    for (const balance of filteredBalances) {
      const balanceType =
        balance.category === creditCategory
          ? BalanceType.CREDIT
          : BalanceType.DEBIT;
      const aValue = balance.credit_a_value;
      const bValue = balance.credit_b_value;
      const oldModelYearId = balance.model_year_id;
      if (!oldModelYearId) {
        throw new Error(
          `SRCA with id ${balance.id} has an unknown model year id!`,
        );
      }
      const modelYear = mapOfModelYearIdsToModelYearEnum[oldModelYearId];
      if (!modelYear) {
        throw new Error(
          `SRCA with id ${balance.id} has an unknown model year id!`,
        );
      }
      if (aValue && !aValue.equals(0)) {
        await createEndingBalance(
          tx,
          newOrgId,
          complianceYear,
          balanceType,
          aValue,
          aValue,
          ZevClass.A,
          VehicleClass.REPORTABLE,
          modelYear,
        );
      }
      if (bValue && !bValue.equals(0)) {
        await createEndingBalance(
          tx,
          newOrgId,
          complianceYear,
          balanceType,
          bValue,
          bValue,
          balanceType === BalanceType.CREDIT
            ? ZevClass.B
            : ZevClass.UNSPECIFIED,
          VehicleClass.REPORTABLE,
          modelYear,
        );
      }
    }
  }

  const myrs = await prismaOld.model_year_report.findMany({
    where: {
      id: {
        notIn: oldMyrIdsWithReassessments,
      },
      OR: [
        { validation_status: "ASSESSED" },
        { validation_status: "REASSESSED" },
      ],
    },
    include: {
      model_year_report_compliance_obligation: {
        select: {
          id: true,
          from_gov: true,
          category: true,
          model_year_id: true,
          credit_a_value: true,
          credit_b_value: true,
        },
      },
    },
  });
  for (const myr of myrs) {
    const newOrgId = mapOfOldOrgIdsToNewOrgIds[myr.organization_id];
    if (!newOrgId) {
      throw new Error(`myr with id ${myr.id} has an unknown org id!`);
    }
    const complianceYear = mapOfModelYearIdsToModelYearEnum[myr.model_year_id];
    if (!complianceYear) {
      throw new Error(`myr with id ${myr.id} has an unknown model year id!`);
    }
    const filteredBalances = myr.model_year_report_compliance_obligation.filter(
      (balance) =>
        balance.from_gov &&
        (balance.category === creditCategory ||
          balance.category === debitCategory),
    );
    const allZero = isAllZero(filteredBalances);
    if (allZero) {
      await createEndingBalance(
        tx,
        newOrgId,
        complianceYear,
        BalanceType.CREDIT,
        new Decimal(0),
        new Decimal(0),
        ZevClass.A,
        VehicleClass.REPORTABLE,
        complianceYear,
      );
      await createEndingBalance(
        tx,
        newOrgId,
        complianceYear,
        BalanceType.CREDIT,
        new Decimal(0),
        new Decimal(0),
        ZevClass.B,
        VehicleClass.REPORTABLE,
        complianceYear,
      );
      continue;
    }
    for (const balance of filteredBalances) {
      const balanceType =
        balance.category === creditCategory
          ? BalanceType.CREDIT
          : BalanceType.DEBIT;
      const aValue = balance.credit_a_value;
      const bValue = balance.credit_b_value;
      const oldModelYearId = balance.model_year_id;
      const modelYear = mapOfModelYearIdsToModelYearEnum[oldModelYearId];
      if (!modelYear) {
        throw new Error(
          `MYRCO with id ${balance.id} has an unknown model year id!`,
        );
      }
      if (aValue && !aValue.equals(0)) {
        await createEndingBalance(
          tx,
          newOrgId,
          complianceYear,
          balanceType,
          aValue,
          aValue,
          ZevClass.A,
          VehicleClass.REPORTABLE,
          modelYear,
        );
      }
      if (bValue && !bValue.equals(0)) {
        await createEndingBalance(
          tx,
          newOrgId,
          complianceYear,
          balanceType,
          bValue,
          bValue,
          balanceType === BalanceType.CREDIT
            ? ZevClass.B
            : ZevClass.UNSPECIFIED,
          VehicleClass.REPORTABLE,
          modelYear,
        );
      }
    }
  }
};
