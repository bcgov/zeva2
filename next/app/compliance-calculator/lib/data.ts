import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  TransactionType,
  VehicleClass,
  VehicleStatus,
  ZevClass,
} from "@/prisma/generated/client";
import {
  unspecifiedComplianceRatios,
  specialComplianceRatios,
} from "@/app/lib/constants/complianceRatio";
import { fetchBalance } from "@/app/lib/services/balance";
import { sumBalance } from "@/lib/utils/zevUnit";
import { ComplianceRatio, VehicleModel, CreditBalance } from "./types";

export const getModelYears = async (): Promise<ModelYear[]> => {
  const { userOrgId } = await getUserInfo();
  
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

export const getComplianceRatios = (): ComplianceRatio[] => {
  const ratios = unspecifiedComplianceRatios[VehicleClass.REPORTABLE] ?? {};
  const zevClassAData =
    specialComplianceRatios[VehicleClass.REPORTABLE]?.[ZevClass.A] ?? {};

  return (Object.entries(ratios) as [ModelYear, string][]).map(
    ([modelYear, ratio]) => ({
      modelYear,
      complianceRatio: parseFloat(ratio) * 100,
      zevClassA: parseFloat(zevClassAData[modelYear] ?? "0") * 100,
    }),
  );
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

  const balance = await fetchBalance(userOrgId);

  if (!balance || balance === "deficit") {
    return { A: 0, B: 0 };
  }

  return {
    A: sumBalance(balance, TransactionType.CREDIT, VehicleClass.REPORTABLE, ZevClass.A).toNumber(),
    B: sumBalance(balance, TransactionType.CREDIT, VehicleClass.REPORTABLE, ZevClass.B).toNumber(),
  };
};
