import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Prisma,
  Role,
} from "@/prisma/generated/client";
import { getOrderByClause, getWhereClause } from "./utilsServer";
import { getObject } from "@/app/lib/minio";

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
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let whereClause: Prisma.ModelYearReportWhereUniqueInput = {
    id,
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  } else if (userIsGov && userRoles.includes(Role.ENGINEER_ANALYST)) {
    whereClause = {
      ...whereClause,
      NOT: {
        status: ModelYearReportStatus.RETURNED_TO_ANALYST,
      },
    };
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause = {
      ...whereClause,
      status: {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          ModelYearReportStatus.ASSESSED,
        ],
      },
    };
  } else {
    return null;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: whereClause,
    select: {
      organization: {
        select: {
          name: true,
        },
      },
      status: true,
      supplierStatus: true,
      objectName: true,
      forecastReportObjectName: true,
    },
  });
  if (!myr) {
    return null;
  }
  const myrFile = await getObject(myr.objectName);
  const forecastFile = await getObject(myr.forecastReportObjectName);
  return {
    status: myr.status,
    supplierStatus: myr.supplierStatus,
    myrFile,
    forecastFile,
  };
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
      where.modelYearReportHistory = {
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

export const getLatestReassessment = async (
  organizationId: number,
  modelYear: ModelYear,
) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ReassessmentWhereInput = {
    organizationId,
    modelYear,
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.reassessment.findFirst({
    where: whereClause,
    orderBy: {
      sequenceNumber: "desc",
    },
  });
};

export const getAssessmentObject = async (myrId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let whereClause: Prisma.ModelYearReportWhereUniqueInput = {
    id: myrId,
  };
  if (!userIsGov) {
    whereClause = {
      ...whereClause,
      organizationId: userOrgId,
      status: ModelYearReportStatus.ASSESSED,
    };
  } else if (userIsGov && userRoles.includes(Role.ENGINEER_ANALYST)) {
    whereClause = {
      ...whereClause,
      NOT: {
        status: {
          in: [
            ModelYearReportStatus.RETURNED_TO_SUPPLIER,
            ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          ],
        },
      },
    };
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause = {
      ...whereClause,
      status: {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          ModelYearReportStatus.ASSESSED,
        ],
      },
    };
  } else {
    return null;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: whereClause,
    select: {
      id: true,
      assessment: {
        select: {
          objectName: true,
        },
      },
    },
  });
  if (!myr || !myr.assessment) {
    return null;
  }
  const assessmentFile = await getObject(myr.assessment.objectName);
  return assessmentFile;
};
