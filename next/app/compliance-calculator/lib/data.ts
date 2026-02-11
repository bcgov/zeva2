import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  VehicleStatus,
  ZevClass,
} from "@/prisma/generated/client";
import { ComplianceRatio, VehicleModel, CreditBalance } from "./types";

export const getModelYears = async (): Promise<ModelYear[]> => {
  // Return all model years from the enum
  return Object.values(ModelYear);
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

  // Get the latest ending balance for the organization
  const balances = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId: userOrgId,
    },
    orderBy: {
      complianceYear: "desc",
    },
    take: 1,
  });

  if (balances.length === 0) {
    return { A: 0, B: 0 };
  }

  const balance = balances[0];
  const classABalance = parseFloat(balance.finalNumberOfUnits.toString());
  const classBBalance = 0;

  return {
    A: classABalance,
    B: classBBalance,
  };
};
