import { prisma } from "@/lib/prisma";
import {
  AddressType,
  CreditApplicationHistoryStatus,
  CreditApplicationStatus,
  ModelYear,
  Prisma,
  TransactionType,
  VehicleClass,
  VehicleStatus,
  VehicleZevType,
  ZevClass,
} from "@/prisma/generated/client";
import { mapOfStatusToSupplierStatus } from "./constants";
import { CaFile } from "@/app/lib/services/attachments";
import { TransactionClient } from "@/types/prisma";
import { getApplicationFullObjectName } from "./utils";
import { putObject } from "@/app/lib/minio";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import { flattenZevUnitRecords, ZevUnitRecord } from "@/lib/utils/zevUnit";

export const getOrgInfo = async (orgId: number) => {
  const orgInfo = await prisma.organization.findUnique({
    where: {
      id: orgId,
    },
    select: {
      name: true,
      organizationAddress: true,
      Vehicle: {
        where: {
          status: VehicleStatus.VALIDATED,
          isActive: true,
        },
        select: {
          make: true,
        },
      },
    },
  });
  if (!orgInfo) {
    throw new Error("Organization not found!");
  }
  const makes: Set<string> = new Set();
  for (const vehicle of orgInfo.Vehicle) {
    makes.add(vehicle.make);
  }
  let serviceAddress: string | null = null;
  let recordsAddress: string | null = null;
  for (const address of orgInfo.organizationAddress) {
    const addressType = address.addressType;
    const addressString = `${address.addressLines}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`;
    if (addressType === AddressType.SERVICE) {
      serviceAddress = addressString;
    } else if (addressType === AddressType.RECORDS) {
      recordsAddress = addressString;
    }
  }
  if (!serviceAddress || !recordsAddress) {
    throw new Error("Service or Records Address not found!");
  }
  return {
    name: orgInfo.name,
    makes: Array.from(makes),
    serviceAddress,
    recordsAddress,
  };
};

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

export const getEligibleVehicles = async (
  orgId: number,
  modelYears: "all" | ModelYear[],
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
      modelYear:
        modelYears === "all"
          ? undefined
          : {
              in: modelYears,
            },
    },
    select,
  });
};

// returns a map {make -> modelName -> modelYear -> [id, vehicleClass, zevClass, numberOfUnits, zevType, range]}
export const getEligibleVehiclesMap = async (
  orgId: number,
  modelYears: ModelYear[],
) => {
  const result: Partial<
    Record<
      string,
      Partial<
        Record<
          string,
          Partial<
            Record<
              ModelYear,
              [number, VehicleClass, ZevClass, Decimal, VehicleZevType, number]
            >
          >
        >
      >
    >
  > = {};
  const vehicles = await getEligibleVehicles(orgId, modelYears, true);
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
      vehicle.id,
      vehicle.vehicleClass,
      vehicle.zevClass,
      vehicle.numberOfUnits,
      vehicle.vehicleZevType,
      vehicle.range,
    ];
  }
  return result;
};

export const checkMatchesSystemVehicles = async () => {};

export type IcbcRecordsMap = Partial<
  Record<
    string,
    { make: string; modelName: string; modelYear: ModelYear; timestamp: Date }
  >
>;

export const getIcbcRecordsMap = async (
  vins: string[],
): Promise<IcbcRecordsMap> => {
  const result: IcbcRecordsMap = {};
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
  for (const icbcRecord of icbcRecords) {
    result[icbcRecord.vin] = {
      make: icbcRecord.make,
      modelName: icbcRecord.model,
      modelYear: icbcRecord.year,
      timestamp: icbcRecord.icbcFile.timestamp,
    };
  }
  return result;
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

export const getApplicationFlattenedCreditRecords = async (
  creditApplicationId: number,
) => {
  const applicationRecords = await prisma.creditApplicationRecord.findMany({
    where: {
      creditApplicationId,
      validated: true,
    },
    select: {
      vehicleClass: true,
      zevClass: true,
      modelYear: true,
      numberOfUnits: true,
    },
  });
  const zevUnitRecords: ZevUnitRecord[] = [];
  for (const record of applicationRecords) {
    zevUnitRecords.push({ ...record, type: TransactionType.CREDIT });
  }
  return flattenZevUnitRecords(zevUnitRecords);
};

// returns a list of tuples [vehicleId v, # of validated VINs in CA or all VINs in CA associated with v]
export const getVehicleCounts = async (
  creditApplicationId: number,
  type: "all" | "validated",
) => {
  const result: Record<number, [number, number]> = {};
  const application = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
    },
    select: {
      organizationId: true,
      CreditApplicationRecord: {
        where:
          type === "all"
            ? undefined
            : {
                validated: true,
              },
        select: {
          vin: true,
          make: true,
          modelName: true,
          modelYear: true,
        },
      },
    },
  });
  if (!application) {
    throw new Error("Credit application not found!");
  }
  const modelYears: Set<ModelYear> = new Set();
  for (const record of application.CreditApplicationRecord) {
    modelYears.add(record.modelYear);
  }
  const vehiclesMap = await getEligibleVehiclesMap(
    application.organizationId,
    Array.from(modelYears),
  );
  const vinsMissingVehicles: string[] = [];
  for (const record of application.CreditApplicationRecord) {
    const vehicleId =
      vehiclesMap[record.make]?.[record.modelName]?.[record.modelYear]?.[0];
    if (!vehicleId) {
      vinsMissingVehicles.push(record.vin);
      continue;
    }
    if (!result[vehicleId]) {
      result[vehicleId] = [vehicleId, 0];
    }
    result[vehicleId][1] = result[vehicleId][1] + 1;
  }
  if (vinsMissingVehicles.length > 0) {
    throw new Error(
      `System vehicles not found for the following VINs: ${vinsMissingVehicles.join(", ")}`,
    );
  }
  return Object.values(result);
};
