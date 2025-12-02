import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Prisma,
  ReassessmentStatus,
  SupplierReassessmentStatus,
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
        status: ModelYearReportStatus.RETURNED_TO_SUPPLIER,
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
  reassessmentStatus: ReassessmentStatus | null;
  supplierReassessmentStatus: SupplierReassessmentStatus | null;
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
    reassessmentStatus: true,
    supplierReassessmentStatus: true,
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

export const getReassessment = async (
  reassessmentId: number,
  myrId?: number,
) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ReassessmentWhereUniqueInput = {
    id: reassessmentId,
    NOT: { status: ReassessmentStatus.DELETED },
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = ReassessmentStatus.ISSUED;
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: whereClause,
    select: {
      id: true,
      modelYear: true,
      organizationId: true,
      status: true,
    },
  });
  if (!reassessment) {
    return null;
  }
  if (myrId) {
    const myr = await prisma.modelYearReport.findUnique({
      where: {
        id: myrId,
      },
      select: {
        modelYear: true,
        organizationId: true,
      },
    });
    if (!myr) {
      return null;
    }
    if (
      myr.modelYear !== reassessment.modelYear ||
      myr.organizationId !== reassessment.organizationId
    ) {
      return null;
    }
  }
  return reassessment;
};

export const getReassessmentObject = async (reassessmentId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: Prisma.ReassessmentWhereUniqueInput = {
    id: reassessmentId,
    NOT: { status: ReassessmentStatus.DELETED },
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = ReassessmentStatus.ISSUED;
  }
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      not: ReassessmentStatus.RETURNED_TO_ANALYST,
    };
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: whereClause,
    select: {
      objectName: true,
    },
  });
  if (!reassessment) {
    return null;
  }
  return await getObject(reassessment.objectName);
};

export const getReassessmentHistory = async (reassessmentId: number) => {
  const { userIsGov } = await getUserInfo();
  const whereClause: Prisma.ReassessmentHistoryWhereInput = {
    id: reassessmentId,
  };
  if (!userIsGov) {
    whereClause.userAction = ReassessmentStatus.ISSUED;
  }
  return await prisma.reassessmentHistory.findMany({
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

export type LegacyReassessment = {
  id: number;
  modelYear: ModelYear;
  status: ReassessmentStatus;
  sequenceNumber: number;
  organization?: {
    name: string;
  };
};

export const getLegacyReassessments = async (
  page: number,
  pageSize: number,
): Promise<[LegacyReassessment[], number]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const where: Prisma.ReassessmentWhereInput = {
    status: {
      not: ReassessmentStatus.DELETED,
    },
    modelYearReportId: null,
  };
  const select: Prisma.ReassessmentSelect = {
    id: true,
    modelYear: true,
    status: true,
    sequenceNumber: true,
  };
  if (userIsGov) {
    select.organization = {
      select: {
        name: true,
      },
    };
    if (userRoles.includes(Role.DIRECTOR)) {
      where.ReassessmentHistory = {
        some: {
          userAction: ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
        },
      };
    }
  } else {
    where.organizationId = userOrgId;
    where.status = ReassessmentStatus.ISSUED;
  }
  return await prisma.$transaction([
    prisma.reassessment.findMany({
      skip,
      take,
      select,
      where,
      orderBy: [{ organizationId: "asc" }, { sequenceNumber: "asc" }],
    }),
    prisma.reassessment.count({
      where,
    }),
  ]);
};

export const getReassessments = async (myrId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const myrWhereClause: Prisma.ModelYearReportWhereUniqueInput = {
    id: myrId,
    status: ModelYearReportStatus.ASSESSED,
  };
  if (!userIsGov) {
    myrWhereClause.organizationId = userOrgId;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: myrWhereClause,
    select: {
      organizationId: true,
      modelYear: true,
    },
  });
  if (!myr) {
    return [];
  }
  const whereClause: Prisma.ReassessmentWhereInput = {
    organizationId: myr.organizationId,
    modelYear: myr.modelYear,
    status: {
      not: ReassessmentStatus.DELETED,
    },
  };
  if (!userIsGov) {
    whereClause.status = ReassessmentStatus.ISSUED;
  }
  return await prisma.reassessment.findMany({
    where: whereClause,
    select: {
      id: true,
      status: true,
      sequenceNumber: true,
    },
  });
};
