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

  // Get the most recent compliance year's ending balance for the organization
  const latestBalance = await prisma.zevUnitEndingBalance.findFirst({
    where: {
      organizationId: userOrgId,
    },
    orderBy: {
      complianceYear: "desc",
    },
    select: {
      complianceYear: true,
    },
  });

  if (!latestBalance) {
    return { A: 0, B: 0 };
  }

  // Get all ending balances for the most recent compliance year, grouped by ZEV class
  const balances = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId: userOrgId,
      complianceYear: latestBalance.complianceYear,
    },
    select: {
      finalNumberOfUnits: true,
      zevClass: true,
    },
  });

  // Sum balances by ZEV class
  const classBalances = balances.reduce((acc, balance) => {
    const className = balance.zevClass;
    if (!acc[className]) {
      acc[className] = 0;
    }
    acc[className] += parseFloat(balance.finalNumberOfUnits.toString());
    return acc;
  }, {} as Record<string, number>);

  return {
    A: classBalances.A || 0,
    B: classBalances.B || 0,
  };
};
