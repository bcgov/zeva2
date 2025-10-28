import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditApplication,
  CreditApplicationHistory,
  CreditApplicationRecord,
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
  Organization,
  Prisma,
  Role,
  User,
} from "@/prisma/generated/client";
import {
  getOrderByClause,
  getRecordsOrderByClause,
  getRecordsWhereClause,
  getWhereClause,
} from "./utils";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";

export type CreditApplicationWithOrg = CreditApplication & {
  organization: Organization;
};

export const getCreditApplication = async (
  creditApplicationId: number,
): Promise<CreditApplicationWithOrg | null> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  if (!userIsGov) {
    whereClause = { ...whereClause, organizationId: userOrgId };
  }
  return await prisma.creditApplication.findUnique({
    where: whereClause,
    include: {
      organization: true,
    },
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

export type CreditApplicationSparse = Pick<
  CreditApplication,
  "id" | "status" | "submissionTimestamp" | "supplierStatus"
> & { organization: { name: string } };

export const getCreditApplications = async (
  page: number,
  pageSize: number,
  filters: { [key: string]: string },
  sorts: { [key: string]: string },
): Promise<[CreditApplicationSparse[], number]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const where = getWhereClause(filters, userIsGov);
  const orderBy = getOrderByClause(sorts, true, userIsGov);
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    where.CreditApplicationHistory = {
      some: {
        userAction: {
          in: [
            CreditApplicationStatus.RECOMMEND_APPROVAL,
            CreditApplicationStatus.RECOMMEND_REJECTION,
          ],
        },
      },
    };
  } else if (!userIsGov) {
    where.organizationId = userOrgId;
  }
  return await prisma.$transaction([
    prisma.creditApplication.findMany({
      skip,
      take,
      where,
      select: {
        id: true,
        status: true,
        submissionTimestamp: true,
        supplierStatus: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy,
    }),
    prisma.creditApplication.count({
      where,
    }),
  ]);
};

export type CreditApplicationHistoryWithUser = CreditApplicationHistory & {
  user: Pick<User, "firstName" | "lastName"> & {
    organization: Pick<Organization, "isGovernment">;
  };
};

export const getApplicationHistories = async (
  creditApplicationId: number,
): Promise<CreditApplicationHistoryWithUser[]> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const where: Prisma.CreditApplicationHistoryWhereInput = {
    creditApplicationId,
  };
  if (!userIsGov) {
    where.creditApplication = {
      organizationId: userOrgId,
    };
    where.userAction = {
      in: Object.values(CreditApplicationSupplierStatus),
    };
  }
  return await prisma.creditApplicationHistory.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          organization: {
            select: {
              isGovernment: true,
            },
          },
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
};

export type ModelMismatchesMap = Partial<
  Record<string, Partial<Record<string, number>>>
>;

export const getModelMismatchesMap = async (
  creditApplicationId: number,
): Promise<ModelMismatchesMap> => {
  const result: ModelMismatchesMap = {};
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return {};
  }
  const records = await prisma.creditApplicationRecord.findMany({
    where: {
      creditApplicationId,
    },
    select: {
      modelName: true,
      icbcModelName: true,
    },
  });
  records.forEach((record) => {
    const modelName = record.modelName;
    const icbcModelName = record.icbcModelName;
    if (!icbcModelName) {
      return;
    }
    if (!result[modelName]) {
      result[modelName] = {};
      result[modelName][icbcModelName] = 0;
    }
    if (!result[modelName][icbcModelName]) {
      result[modelName][icbcModelName] = 0;
    }
    result[modelName][icbcModelName] = result[modelName][icbcModelName] + 1;
  });
  return result;
};
