import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditApplicationRecord,
  Prisma,
  TransactionType,
} from "@/prisma/generated/client";
import { getRecordsOrderByClause, getRecordsWhereClause } from "./utils";
import {
  getSummedZevUnitRecordsObj,
  ZevUnitRecord,
  ZevUnitRecordsObj,
} from "@/lib/utils/zevUnit";

export const getCreditApplication = async (creditApplicationId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  if (!userIsGov) {
    whereClause = { ...whereClause, organizationId: userOrgId };
  }
  return await prisma.creditApplication.findUnique({
    where: whereClause,
  });
};

export type CreditApplicationRecordSparse = Omit<
  CreditApplicationRecord,
  "vehicleClass" | "zevClass" | "numberOfUnits"
>;

export const getValidatedRecords = async (
  creditApplicationId: number,
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<[CreditApplicationRecordSparse[], number]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const where = getRecordsWhereClause(filters);
  where.creditApplicationId = creditApplicationId;
  const orderBy = getRecordsOrderByClause(sorts, true);
  return await prisma.$transaction([
    prisma.creditApplicationRecord.findMany({
      omit: {
        vehicleClass: true,
        zevClass: true,
        numberOfUnits: true,
      },
      orderBy,
      skip,
      take,
      where,
    }),
    prisma.creditApplicationRecord.count({
      where,
    }),
  ]);
};

export type CreditApplicationCredit = Omit<ZevUnitRecord, "type">;

export const getData = async (
  creditApplicationId: number,
): Promise<{
  numberOfRecords: number;
  credits: CreditApplicationCredit[];
}> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
  const records = await prisma.creditApplicationRecord.findMany({
    where: {
      creditApplicationId,
    },
    select: {
      validated: true,
      vehicleClass: true,
      zevClass: true,
      modelYear: true,
      numberOfUnits: true,
    },
  });
  const zevUnitRecords: CreditApplicationCredit[] = [];
  records.forEach((record) => {
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    const modelYear = record.modelYear;
    const numberOfUnits = record.numberOfUnits;
    if (record.validated && vehicleClass && zevClass && numberOfUnits) {
      const zevUnitRecord = {
        vehicleClass,
        zevClass,
        modelYear,
        numberOfUnits,
      };
      zevUnitRecords.push(zevUnitRecord);
    }
  });
  return {
    numberOfRecords: records.length,
    credits: zevUnitRecords,
  };
};
