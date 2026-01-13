import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditApplication,
  CreditApplicationHistory,
  CreditApplicationRecord,
  CreditApplicationStatus,
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
import { getCreditStats, getRecordStats } from "./services";

export type CreditApplicationWithOrgAndAttachmentsCount = CreditApplication & {
  organization: Organization;
  _count: {
    CreditApplicationAttachment: number;
  };
};

export const getCreditApplication = async (
  creditApplicationId: number,
): Promise<CreditApplicationWithOrgAndAttachmentsCount | null> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  if (userIsGov) {
    const notClause: Prisma.CreditApplicationWhereInput[] = [
      {
        status: {
          in: [
            CreditApplicationStatus.DELETED,
            CreditApplicationStatus.DRAFT,
            CreditApplicationStatus.REJECTED,
          ],
        },
      },
    ];
    if (userRoles.includes(Role.DIRECTOR)) {
      notClause.push({
        status: {
          in: [
            CreditApplicationStatus.RETURNED_TO_ANALYST,
            CreditApplicationStatus.SUBMITTED,
          ],
        },
      });
    }
    whereClause = { ...whereClause, NOT: notClause };
  } else {
    whereClause = {
      ...whereClause,
      organizationId: userOrgId,
      NOT: {
        status: CreditApplicationStatus.DELETED,
      },
    };
  }
  return await prisma.creditApplication.findUnique({
    where: whereClause,
    include: {
      organization: true,
      _count: {
        select: {
          CreditApplicationAttachment: true,
        },
      },
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
  | "id"
  | "status"
  | "submissionTimestamp"
  | "supplierStatus"
  | "transactionTimestamps"
  | "modelYears"
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
  const where: Prisma.CreditApplicationWhereInput = getWhereClause(
    filters,
    userIsGov,
  );
  const orderBy = getOrderByClause(sorts, true, userIsGov);
  if (userIsGov) {
    where.NOT = [
      {
        status: {
          in: [
            CreditApplicationStatus.DELETED,
            CreditApplicationStatus.DRAFT,
            CreditApplicationStatus.REJECTED,
          ],
        },
      },
    ];
    if (userRoles.includes(Role.DIRECTOR)) {
      where.NOT.push({
        status: {
          in: [
            CreditApplicationStatus.RETURNED_TO_ANALYST,
            CreditApplicationStatus.SUBMITTED,
          ],
        },
      });
    }
  } else {
    where.organizationId = userOrgId;
    where.NOT = {
      status: CreditApplicationStatus.DELETED,
    };
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
        transactionTimestamps: true,
        supplierStatus: true,
        organization: {
          select: {
            name: true,
          },
        },
        modelYears: true,
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
      in: [
        CreditApplicationStatus.APPROVED,
        CreditApplicationStatus.REJECTED,
        CreditApplicationStatus.SUBMITTED,
      ],
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

export const getApplicationStatistics = async (creditApplicationId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
    NOT: {
      status: CreditApplicationStatus.DELETED,
    },
  };
  if (userIsGov) {
    whereClause.status = {
      not: CreditApplicationStatus.DRAFT,
    };
  } else {
    whereClause.organizationId = userOrgId;
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: whereClause,
    select: {
      status: true,
    },
  });
  if (!creditApplication) {
    return null;
  }
  const status = creditApplication.status;
  const getValidatedStats =
    userIsGov || status === CreditApplicationStatus.APPROVED;
  return {
    status,
    recordStats: await getRecordStats(creditApplicationId, "all"),
    recordStatsValidated: getValidatedStats
      ? await getRecordStats(creditApplicationId, "validated")
      : null,
    creditStats: await getCreditStats(creditApplicationId, "all"),
    creditStatsValidated: getValidatedStats
      ? await getCreditStats(creditApplicationId, "validated")
      : null,
  };
};

export const getAttachmentsCount = async (creditApplicationId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.CreditApplicationAttachmentWhereInput = {
    creditApplicationId,
  };
  if (!userIsGov) {
    whereClause.creditApplication = {
      organizationId: userOrgId,
    };
  }
  return await prisma.creditApplicationAttachment.count({
    where: whereClause,
  });
};
