import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  VehicleStatus,
  ZevClass,
} from "@/prisma/generated/client";
import { ComplianceRatio, VehicleModel, CreditBalance } from "./types";

export const getModelYears = async (): Promise<ModelYear[]> => {
  const { userOrgId } = await getUserInfo();
  
  // Get distinct model years from the organization's validated vehicles
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: userOrgId,
      isActive: true,
      status: VehicleStatus.VALIDATED,
    },
    select: {
      modelYear: true,
    },
    distinct: ['modelYear'],
    orderBy: {
      modelYear: 'asc',
    },
  });

  return vehicles.map((v) => v.modelYear);
};

export const getComplianceRatios = async (): Promise<ComplianceRatio[]> => {
  const ratios = await prisma.complianceRatio.findMany({
    orderBy: {
      modelYear: "asc",
    },
  });

  return ratios.map((ratio) => ({
    modelYear: ratio.modelYear,
    complianceRatio: parseFloat(ratio.complianceRatio.toString()),
    zevClassA: parseFloat(ratio.zevClassA.toString()),
  }));
};

export const getActiveVehicles = async (): Promise<VehicleModel[]> => {
  const { userOrgId } = await getUserInfo();
  
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: userOrgId,
      isActive: true,
      status: VehicleStatus.VALIDATED,
    },
    select: {
      id: true,
      make: true,
      modelName: true,
      modelYear: true,
      numberOfUnits: true,
      zevClass: true,
      isActive: true,
    },
    orderBy: [{ modelYear: "desc" }, { make: "asc" }, { modelName: "asc" }],
  });

  return vehicles.map((v) => ({
    id: v.id,
    make: v.make,
    modelName: v.modelName,
    modelYear: v.modelYear,
    creditValue: typeof v.numberOfUnits === 'number' ? v.numberOfUnits : parseFloat(v.numberOfUnits.toString()),
    creditClass: v.zevClass,
    isActive: v.isActive,
  }));
};

export const getUserCreditBalance = async (): Promise<CreditBalance> => {
  const { userOrgId, userIsGov } = await getUserInfo();

  if (userIsGov) {
    return { A: 0, B: 0 };
  }

  const transactions = await prisma.zevUnitTransaction.findMany({
    where: {
      organizationId: userOrgId,
    },
    select: {
      type: true,
      numberOfUnits: true,
      zevClass: true,
    },
  });

  let unspecifiedDebits = 0;
  const classBalances = transactions.reduce((acc, transaction) => {
    const className = transaction.zevClass;
    const units = parseFloat(transaction.numberOfUnits.toString());

    if (className === 'UNSPECIFIED') {
      if (transaction.type === 'DEBIT' || transaction.type === 'TRANSFER_AWAY') {
        unspecifiedDebits += units;
      }
      return acc;
    }

    if (className !== 'A' && className !== 'B') {
      return acc;
    }

    if (!acc[className]) {
      acc[className] = 0;
    }

    if (transaction.type === 'CREDIT') {
      acc[className] += units;
    } else if (transaction.type === 'DEBIT' || transaction.type === 'TRANSFER_AWAY') {
      acc[className] -= units;
    }

    return acc;
  }, {} as Record<string, number>);

  if (unspecifiedDebits > 0) {
    const balanceB = classBalances.B || 0;
    
    if (balanceB >= unspecifiedDebits) {
      classBalances.B = balanceB - unspecifiedDebits;
    } else {
      classBalances.B = 0;
      const remainingDebit = unspecifiedDebits - balanceB;
      classBalances.A = (classBalances.A || 0) - remainingDebit;
    }
  }

  return {
    A: classBalances.A || 0,
    B: classBalances.B || 0,
  };
};
