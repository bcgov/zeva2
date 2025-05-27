import {
  getObject,
  putObject,
  getPresignedGetObjectUrl,
} from "@/app/lib/minio";
import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  ModelYear,
  ReferenceType,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { Directory } from "./constants";
import { createReadStream } from "fs";
import Excel from "exceljs";
import { randomUUID } from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import {
  getSupplierVehiclesSelectClause,
  getSupplierVehiclesWhereClause,
} from "./utils";
import { CreditsPayload } from "./components/ParsedApplication";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehiclClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { Prisma } from "@/prisma/generated/client";
import { PrismaClient } from "@prisma/client";

export type SupplierVehicleSparse = {
  id: number;
  make: string;
  modelName: string;
  modelYear: ModelYear;
};

export const getSupplierVehiclesSparse = async (
  orgId: number,
): Promise<SupplierVehicleSparse[]> => {
  return await prisma.vehicle.findMany({
    where: getSupplierVehiclesWhereClause(orgId),
    select: getSupplierVehiclesSelectClause(),
  });
};

export type SupplierVehicle = SupplierVehicleSparse & {
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  creditValue: Decimal;
};

export const getSupplierVehicles = async (
  orgId: number,
): Promise<SupplierVehicle[]> => {
  return (await prisma.vehicle.findMany({
    where: getSupplierVehiclesWhereClause(orgId),
    select: {
      ...getSupplierVehiclesSelectClause(),
      vehicleClass: true,
      zevClass: true,
      creditValue: true,
    },
  })) as SupplierVehicle[];
};

export type SupplierVehiclesMap = Record<
  string,
  Record<string, Partial<Record<ModelYear, number>>>
>;

export const getSupplierVehiclesMapSparse = async (
  orgId: number,
): Promise<SupplierVehiclesMap> => {
  const vehicles = await getSupplierVehiclesSparse(orgId);
  const vehiclesMap: SupplierVehiclesMap = {};
  for (const vehicle of vehicles) {
    const make = vehicle.make;
    const modelName = vehicle.modelName;
    const modelYear = vehicle.modelYear;
    if (!vehiclesMap[make]) {
      vehiclesMap[make] = {};
    }
    if (!vehiclesMap[make][modelName]) {
      vehiclesMap[make][modelName] = {};
    }
    vehiclesMap[make][modelName][modelYear] = vehicle.id;
  }
  return vehiclesMap;
};

export type VehiclesMap = Partial<
  Record<
    number,
    {
      make: string;
      modelName: string;
      modelYear: ModelYear;
      vehicleClass: VehicleClass;
      zevClass: ZevClass;
      creditValue: string;
    }
  >
>;

export const getSupplierVehiclesMap = async (
  orgId: number,
): Promise<VehiclesMap> => {
  const result: VehiclesMap = {};
  const vehicles = await getSupplierVehicles(orgId);
  vehicles.forEach((vehicle) => {
    result[vehicle.id] = {
      make: vehicle.make,
      modelName: vehicle.modelName,
      modelYear: vehicle.modelYear,
      vehicleClass: vehicle.vehicleClass,
      zevClass: vehicle.zevClass,
      creditValue: vehicle.creditValue.toString(),
    };
  });
  return result;
};

export const getCreditApplicationTemplate = async (templateName: string) => {
  // there may be cwd/path differences/issues after the app is built/deployed,
  // so, in that case, we get the template from object storage
  let template;
  if (process.env.NODE_ENV === "production") {
    template = await getObject(Directory.Templates + templateName);
  } else {
    template = createReadStream(
      "app/credit-application/lib/templates/" + templateName,
    );
  }
  return template;
};

export const putWorkbook = async (prefix: string, workbook: Excel.Workbook) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const generatedTemplateName = prefix + randomUUID();
  // use ts-ignore below; the return type of writeBuffer() is mis-typed;
  // see: https://github.com/exceljs/exceljs/issues/1032
  // @ts-ignore
  await putObject(generatedTemplateName, buffer);
  return await getPresignedGetObjectUrl(generatedTemplateName);
};

export const getCreditApplicationVins = async (creditApplicationId: number) => {
  return await prisma.vinAssociatedWithCreditApplication.findMany({
    where: {
      creditApplication: {
        id: creditApplicationId,
        OR: [
          { status: CreditApplicationStatus.SUBMITTED },
          { status: CreditApplicationStatus.RETURNED_TO_ANALYST },
        ],
      },
    },
    select: {
      vin: true,
      timestamp: true,
      vehicleId: true,
    },
  });
};

export type VinRecordsMap = {
  [key: string]: {
    timestamp: Date;
    vehicleId: number;
    errors: string[];
  };
};

export const getVinRecordsMap = async (
  creditApplicationId: number,
): Promise<VinRecordsMap> => {
  const records = await getCreditApplicationVins(creditApplicationId);
  const recordsMap: VinRecordsMap = {};
  for (const record of records) {
    recordsMap[record.vin] = {
      timestamp: record.timestamp,
      vehicleId: record.vehicleId,
      errors: [],
    };
  }
  return recordsMap;
};

export type IcbcRecordsMap = {
  [key: string]: {
    make: string;
    model: string;
    year: ModelYear;
    timestamp: Date;
  };
};

export const getIcbcRecordsMap = async (
  vins: string[],
): Promise<IcbcRecordsMap> => {
  const icbcRecords = await getCreditApplicationIcbcRecords(vins);
  const icbcMap: IcbcRecordsMap = {};
  for (const icbcRecord of icbcRecords) {
    icbcMap[icbcRecord.vin] = {
      make: icbcRecord.make,
      model: icbcRecord.model,
      year: icbcRecord.year,
      timestamp: icbcRecord.icbcFile.timestamp,
    };
  }
  return icbcMap;
};

export const getCreditApplicationIcbcRecords = async (vins: string[]) => {
  return await prisma.icbcRecord.findMany({
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
};

export const createTransactions = async (
  creditApplicationId: number,
  organizationId: number,
  credits: CreditsPayload,
  transactionClient?: PrismaClient,
) => {
  const vehicleClassMap = getStringsToVehiclClassEnumsMap();
  const zevClassMap = getStringsToZevClassEnumsMap();
  const modelYearMap = getStringsToModelYearsEnumsMap();

  const transactionsToCreate: Prisma.ZevUnitTransactionCreateManyInput[] = [];
  credits.forEach((credit) => {
    const vehicleClass = vehicleClassMap[credit.vehicleClass];
    const zevClass = zevClassMap[credit.zevClass];
    const modelYear = modelYearMap[credit.modelYear];
    const numberOfUnits = new Decimal(credit.numberOfCredits);
    if (
      !vehicleClass ||
      !zevClass ||
      !modelYear ||
      numberOfUnits.lt(new Decimal(0))
    ) {
      throw new Error("Invalid credit found!");
    }
    transactionsToCreate.push({
      organizationId,
      type: TransactionType.CREDIT,
      referenceId: creditApplicationId,
      referenceType: ReferenceType.SUPPLY_CREDITS,
      numberOfUnits,
      vehicleClass,
      zevClass,
      modelYear,
    });
  });
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.zevUnitTransaction.createMany({
    data: transactionsToCreate,
  });
};

export const updateVins = async (
  creditApplicationId: number,
  vins: string[],
  transactionClient?: PrismaClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  const supplierVins: { vin: string }[] =
    await prismaClient.vinAssociatedWithCreditApplication.findMany({
      where: {
        creditApplicationId,
      },
      select: {
        vin: true,
      },
    });
  const supplierVinsSet = new Set<string>();
  const approvedVinsSet = new Set<string>(vins);
  supplierVins.forEach((element) => [supplierVinsSet.add(element.vin)]);
  const invalidVins = approvedVinsSet.difference(supplierVinsSet);
  if (invalidVins.size > 0) {
    throw new Error("Invalid VIN found!");
  }
  const vinsToDelete = Array.from(supplierVinsSet.difference(approvedVinsSet));
  if (vinsToDelete.length > 0) {
    prismaClient.vinAssociatedWithCreditApplication.deleteMany({
      where: {
        vin: {
          in: vinsToDelete,
        },
      },
    });
  }
};
