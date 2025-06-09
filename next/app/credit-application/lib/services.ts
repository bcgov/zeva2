import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  ModelYear,
  Prisma,
  Vehicle,
  VehicleStatus,
} from "@/prisma/generated/client";
import { mapOfStatusToSupplierStatus } from "./constants";

export const getReservedVins = async (vins: string[]) => {
  const where = {
    vin: {
      in: vins,
    },
  };
  const select = {
    vin: true,
  };
  const [vinRecords, legacyVinRecords] = await prisma.$transaction([
    prisma.creditApplicationVin.findMany({
      where,
      select,
    }),
    prisma.creditApplicationVinLegacy.findMany({
      where,
      select,
    }),
  ]);
  return vinRecords.concat(legacyVinRecords);
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
  const records = await prisma.creditApplicationVin.findMany({
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

export const updateStatus = (
  creditApplicationId: number,
  status: CreditApplicationStatus,
) => {
  return prisma.creditApplication.update({
    where: {
      id: creditApplicationId,
    },
    data: {
      status: status,
      supplierStatus: mapOfStatusToSupplierStatus[status],
    },
  });
};

export const unreserveVins = (creditApplicationId: number, vins?: string[]) => {
  const where: Prisma.CreditApplicationVinWhereInput = {
    creditApplicationId,
  };
  if (vins) {
    where.vin = {
      in: vins,
    };
  }
  return prisma.creditApplicationVin.deleteMany({
    where,
  });
};
