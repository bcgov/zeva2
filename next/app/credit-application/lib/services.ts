import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  ModelYear,
  Vehicle,
  VehicleStatus,
} from "@/prisma/generated/client";

export const getReservedVins = async (vins: string[]) => {
  return await prisma.reservedVin.findMany({
    where: {
      vin: {
        in: vins,
      },
    },
    select: {
      vin: true,
    },
  });
};

export type VehicleSparse = {
  id: number;
  make: string;
  modelName: string;
  modelYear: ModelYear;
};

export const getEligibleVehicles = async (
  orgId: number,
): Promise<VehicleSparse[]> => {
  return await prisma.vehicle.findMany({
    where: {
      organizationId: orgId,
      status: VehicleStatus.VALIDATED,
      vehicleClass: {
        not: null,
      },
      zevClass: {
        not: null,
      },
      creditValue: {
        not: null,
      },
      isActive: true,
    },
    select: {
      id: true,
      make: true,
      modelName: true,
      modelYear: true,
    },
  });
};

export type CreditApplicationVehicle = Pick<
  Vehicle,
  | "status"
  | "isActive"
  | "vehicleClass"
  | "zevClass"
  | "modelYear"
  | "creditValue"
  | "make"
  | "modelName"
>;

export type VinRecordsMap = Record<
  string,
  {
    timestamp: Date;
    vehicle: CreditApplicationVehicle;
  }
>;

export const getVinRecordsMap = async (
  creditApplicationId: number,
): Promise<VinRecordsMap> => {
  const result: VinRecordsMap = {};
  const records = await prisma.reservedVin.findMany({
    where: {
      creditApplicationId,
    },
    select: {
      vin: true,
      timestamp: true,
      vehicle: {
        select: {
          status: true,
          isActive: true,
          vehicleClass: true,
          zevClass: true,
          modelYear: true,
          creditValue: true,
          make: true,
          modelName: true,
        },
      },
    },
  });
  records.forEach((record) => {
    result[record.vin] = {
      timestamp: record.timestamp,
      vehicle: record.vehicle,
    };
  });
  return result;
};

export type IcbcRecordsMap = Partial<
  Record<
    string,
    { make: string; modelName: string; modelYear: ModelYear; timestamp: Date }
  >
>;

export const getIcbcRecordsMap = async (
  vins: string[],
): Promise<IcbcRecordsMap> => {
  const icbcRecords = await prisma.icbcRecord.findMany({
    where: {
      vin: {
        in: vins,
      },
    },
    select: {
      vin: true,
      make: true,
      model: true,
      year: true,
      icbcFile: {
        select: {
          timestamp: true,
        },
      },
    },
  });
  const icbcMap: IcbcRecordsMap = {};
  for (const icbcRecord of icbcRecords) {
    icbcMap[icbcRecord.vin] = {
      make: icbcRecord.make,
      modelName: icbcRecord.model,
      modelYear: icbcRecord.year,
      timestamp: icbcRecord.icbcFile.timestamp,
    };
  }
  return icbcMap;
};

export const createHistory = (
  userId: number,
  creditApplicationId: number,
  userAction: CreditApplicationStatus,
  comment?: string,
) => {
  return prisma.creditApplicationHistory.create({
    data: {
      userId,
      creditApplicationId,
      userAction,
      comment,
    },
  });
};
