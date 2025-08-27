import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Prisma,
  Role,
} from "@/prisma/generated/client";
import { getOrderByClause, getWhereClause } from "./utils";

export const modelYearReportExists = async (modelYear: ModelYear) => {
  const { userOrgId } = await getUserInfo();
  const report = await prisma.modelYearReport.findFirst({
    where: {
      organizationId: userOrgId,
      modelYear: modelYear,
    },
    select: {
      id: true,
    },
  });
  if (report) {
    return true;
  }
  return false;
};

export const getModelYearReport = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ModelYearReportWhereUniqueInput = { id };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.modelYearReport.findUnique({
    where: whereClause,
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
};

export const getMyrHistory = async (myrId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ModelYearReportHistoryWhereInput = {
    modelYearReportId: myrId,
  };
  if (!userIsGov) {
    whereClause.modelYearReport = {
      organizationId: userOrgId,
    };
    whereClause.userAction = {
      in: Object.values(ModelYearReportSupplierStatus),
    };
  }
  return await prisma.modelYearReportHistory.findMany({
    where: whereClause,
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

export const getModelYearReportDetails = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ModelYearReportWhereUniqueInput = {
    id,
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.modelYearReport.findUnique({
    where: whereClause,
    select: {
      organization: {
        select: {
          name: true,
        },
      },
      status: true,
      supplierStatus: true,
      modelYear: true,
    },
  });
};

export type MyrSparse = {
  id: number;
  modelYear: ModelYear;
  status: ModelYearReportStatus;
  supplierStatus: ModelYearReportSupplierStatus;
  organization?: {
    name: string;
  };
};

export const getModelYearReports = async (
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<[MyrSparse[], number]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: Prisma.ModelYearReportWhereInput = getWhereClause(
    filters,
    userIsGov,
  );
  const orderBy = getOrderByClause(sorts, true, userIsGov);
  const select: Prisma.ModelYearReportSelect = {
    id: true,
    modelYear: true,
    status: true,
    supplierStatus: true,
  };
  if (userIsGov) {
    select.organization = {
      select: {
        name: true,
      },
    };
    if (userRoles.includes(Role.DIRECTOR)) {
      where.ModelYearReportHistory = {
        some: {
          userAction: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        },
      };
    }
  } else {
    where.organizationId = userOrgId;
  }
  return await prisma.$transaction([
    prisma.modelYearReport.findMany({
      skip,
      take,
      select,
      where,
      orderBy,
    }),
    prisma.modelYearReport.count({
      where,
    }),
  ]);
};
