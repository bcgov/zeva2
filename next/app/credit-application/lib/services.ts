import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  ModelYear,
  Prisma,
  Vehicle,
  VehicleStatus,
} from "@/prisma/generated/client";
import { mapOfStatusToSupplierStatus } from "./constants";
import { Attachment } from "@/app/lib/services/attachments";
import { TransactionClient } from "@/types/prisma";

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
  | "numberOfUnits"
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
          numberOfUnits: true,
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

export const createHistory = async (
  userId: number,
  creditApplicationId: number,
  userAction: CreditApplicationStatus,
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
  creditApplicationId: number,
  vins?: string[],
  transactionClient?: TransactionClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  const where: Prisma.CreditApplicationVinWhereInput = {
    creditApplicationId,
  };
  if (vins) {
    where.vin = {
      in: vins,
    };
  }
  await prismaClient.creditApplicationVin.deleteMany({
    where,
  });
};

export const createAttachments = async (
  creditApplicationId: number,
  attachments: Attachment[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  const toCreate: Prisma.CreditApplicationAttachmentUncheckedCreateInput[] = [];
  attachments.forEach((attachment) => {
    toCreate.push({
      creditApplicationId,
      fileName: attachment.fileName,
      objectName: attachment.objectName,
    });
  });
  await client.creditApplicationAttachment.createMany({
    data: toCreate,
  });
};
