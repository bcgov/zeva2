import { prisma } from "@/lib/prisma";
import {
  CreditApplicationHistoryStatus,
  CreditApplicationStatus,
  ModelYear,
  Prisma,
  VehicleClass,
  VehicleStatus,
  ZevClass,
} from "@/prisma/generated/client";
import { mapOfStatusToSupplierStatus } from "./constants";
import { CaFile } from "@/app/lib/services/attachments";
import { TransactionClient } from "@/types/prisma";
import { getApplicationFullObjectName } from "./utils";
import { putObject } from "@/app/lib/minio";
import { Decimal } from "@/prisma/generated/client/runtime/library";

export const getReservedVins = async (vins: string[]) => {
  const where = {
    vin: {
      in: vins,
    },
  };
  const select = {
    vin: true,
  };
  const records = await prisma.reservedVin.findMany({
    where,
    select,
  });
  return records.reduce((acc: string[], cv) => {
    return [...acc, cv.vin];
  }, []);
};

export type VehicleSparse = {
  id: number;
  make: string;
  modelName: string;
  modelYear: ModelYear;
};

export const getEligibleVehicles = async (
  orgId: number,
  includeAdditionalFields: boolean,
) => {
  const select: Prisma.VehicleSelect = {
    make: true,
    modelName: true,
    modelYear: true,
  };
  if (includeAdditionalFields) {
    select.vehicleClass = true;
    select.zevClass = true;
    select.numberOfUnits = true;
  }
  return await prisma.vehicle.findMany({
    where: {
      organizationId: orgId,
      status: VehicleStatus.VALIDATED,
      isActive: true,
    },
    select,
  });
};

export const getEligibleVehiclesMap = async (orgId: number) => {
  const result: Partial<
    Record<
      string,
      Partial<
        Record<
          string,
          Partial<Record<ModelYear, [VehicleClass, ZevClass, Decimal]>>
        >
      >
    >
  > = {};
  const vehicles = await getEligibleVehicles(orgId, true);
  for (const vehicle of vehicles) {
    const make = vehicle.make;
    const modelName = vehicle.modelName;
    const modelYear = vehicle.modelYear;
    if (result[make]?.[modelName]?.[modelYear]) {
      throw new Error("Duplicate system vehicles found!");
    }
    if (!result[make]) {
      result[make] = {};
    }
    if (!result[make][modelName]) {
      result[make][modelName] = {};
    }
    result[make][modelName][modelYear] = [
      vehicle.vehicleClass,
      vehicle.zevClass,
      vehicle.numberOfUnits,
    ];
  }
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

export const createHistory = async (
  userId: number,
  creditApplicationId: number,
  userAction: CreditApplicationHistoryStatus,
  comment?: string,
  transactionClient?: TransactionClient,
): Promise<number> => {
  const prismaClient = transactionClient ?? prisma;
  const { id } = await prismaClient.creditApplicationHistory.create({
    data: {
      userId,
      creditApplicationId,
      userAction,
      comment,
    },
  });
  return id;
};

export const updateStatus = async (
  creditApplicationId: number,
  status: CreditApplicationStatus,
  transactionClient?: TransactionClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.creditApplication.update({
    where: {
      id: creditApplicationId,
    },
    data: {
      status: status,
      supplierStatus: mapOfStatusToSupplierStatus[status],
    },
  });
};

export const unreserveVins = async (
  vins: string[],
  transactionClient?: TransactionClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.reservedVin.deleteMany({
    where: {
      vin: {
        in: vins,
      },
    },
  });
};

export const uploadAttachments = async (
  creditApplicationId: number,
  attachments: CaFile[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  for (const attachment of attachments) {
    const objectName = getApplicationFullObjectName("attachment");
    await client.creditApplicationAttachment.create({
      data: {
        creditApplicationId,
        fileName: attachment.fileName,
        objectName,
      },
    });
    const object = Buffer.from(attachment.data, "base64");
    await putObject(objectName, object);
  }
};
