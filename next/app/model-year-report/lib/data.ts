import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  ReassessmentStatus,
  Role,
  SupplierClass,
  SupplementaryReportStatus,
} from "@/prisma/generated/enums";
import {
  ModelYearReportWhereUniqueInput,
  ModelYearReportHistoryWhereInput,
  ModelYearReportWhereInput,
  ModelYearReportSelect,
  ReassessmentWhereUniqueInput,
  ReassessmentHistoryWhereInput,
  ReassessmentWhereInput,
  SupplementaryReportWhereUniqueInput,
  SupplementaryReportHistoryWhereInput,
  SupplementaryReportWhereInput,
} from "@/prisma/generated/models";
import { getOrderByClause, getWhereClause } from "./utilsServer";
import { getObject } from "@/app/lib/minio";
import { getSupplierDetails, getVehicleStatistics } from "./services";
import { getAddressAsString } from "./utils";

export const modelYearReportExists = async (modelYear: ModelYear) => {
  const { userOrgId } = await getUserInfo();
  const report = await prisma.modelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId: userOrgId,
        modelYear,
      },
    },
    select: {
      id: true,
    },
  });
  if (report) {
    return true;
  }
  const legacyAssessedReport =
    await prisma.legacyAssessedModelYearReport.findUnique({
      where: {
        organizationId_modelYear: {
          organizationId: userOrgId,
          modelYear,
        },
      },
      select: {
        id: true,
      },
    });
  if (legacyAssessedReport) {
    return true;
  }
  return false;
};

export const getModelYearReport = async (myrId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: ModelYearReportWhereUniqueInput = { id: myrId };
  if (userIsGov) {
    whereClause.status = {
      notIn: [
        ModelYearReportStatus.DRAFT,
        ModelYearReportStatus.RETURNED_TO_SUPPLIER,
      ],
    };
  } else {
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
      ...(userIsGov && { assessment: true }),
    },
  });
};

export const getMyrHistory = async (myrId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: ModelYearReportHistoryWhereInput = {
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
  let whereClause: ModelYearReportWhereUniqueInput = {
    id,
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
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
      modelYear: true,
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
    modelYear: myr.modelYear,
  };
};

export type MyrSparse = {
  id: number;
  modelYear: ModelYear;
  status: ModelYearReportStatus;
  supplierStatus: ModelYearReportSupplierStatus;
  reassessmentStatus: ReassessmentStatus | null;
  supplementaryReportStatus: SupplementaryReportStatus | null;
  organization?: {
    name: string;
  };
  compliant: boolean | null;
  reportableNvValue: number | null;
  supplierClass: SupplierClass | null;
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

  const where: ModelYearReportWhereInput = getWhereClause(filters, userIsGov);
  const orderBy = getOrderByClause(sorts, true, userIsGov);
  const select: ModelYearReportSelect = {
    id: true,
    modelYear: true,
    status: true,
    supplierStatus: true,
    reassessmentStatus: true,
    supplementaryReportStatus: true,
    compliant: true,
    reportableNvValue: true,
    supplierClass: true,
  };
  if (userIsGov) {
    select.organization = {
      select: {
        name: true,
      },
    };
    if (userRoles.includes(Role.DIRECTOR)) {
      where.NOT = {
        status: {
          in: [
            ModelYearReportStatus.DRAFT,
            ModelYearReportStatus.RETURNED_TO_ANALYST,
            ModelYearReportStatus.RETURNED_TO_SUPPLIER,
            ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          ],
        },
      };
    } else {
      where.NOT = {
        status: {
          in: [
            ModelYearReportStatus.DRAFT,
            ModelYearReportStatus.RETURNED_TO_SUPPLIER,
          ],
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

export const getAssessment = async (myrId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let whereClause: ModelYearReportWhereInput = {};
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = ModelYearReportStatus.ASSESSED;
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    whereClause.NOT = {
      status: {
        in: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    };
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      in: [
        ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ModelYearReportStatus.ASSESSED,
      ],
    };
  } else {
    return null;
  }
  const assessment = await prisma.assessment.findUnique({
    where: {
      modelYearReportId: myrId,
      modelYearReport: whereClause,
    },
  });
  if (!assessment) {
    return null;
  }
  return assessment;
};

export const getReassessment = async (reassessmentId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: ReassessmentWhereUniqueInput = {
    id: reassessmentId,
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      notIn: [ReassessmentStatus.DRAFT, ReassessmentStatus.RETURNED_TO_ANALYST],
    };
  } else if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = ReassessmentStatus.ISSUED;
  }
  return await prisma.reassessment.findUnique({
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

export const getReassessmentHistory = async (reassessmentId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: ReassessmentHistoryWhereInput = {
    reassessmentId,
  };
  if (!userIsGov) {
    whereClause.reassessment = {
      organizationId: userOrgId,
    };
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

export const getReassessments = async (myrId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: ReassessmentWhereInput = {
    modelYearReportId: myrId,
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      notIn: [ReassessmentStatus.DRAFT, ReassessmentStatus.RETURNED_TO_ANALYST],
    };
  } else if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = ReassessmentStatus.ISSUED;
  }
  return await prisma.reassessment.findMany({
    where: whereClause,
    orderBy: {
      sequenceNumber: "asc",
    },
  });
};

export const getSupplementaryReport = async (suppId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: SupplementaryReportWhereUniqueInput = {
    id: suppId,
  };
  if (userIsGov) {
    whereClause.status = {
      not: SupplementaryReportStatus.DRAFT,
    };
  } else {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.supplementaryReport.findUnique({
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

export const getSupplementaryHistories = async (suppId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: SupplementaryReportHistoryWhereInput = {
    supplementaryReportId: suppId,
  };
  if (userIsGov) {
    whereClause.userAction = {
      not: SupplementaryReportStatus.DRAFT,
    };
  } else {
    whereClause.supplementaryReport = {
      organizationId: userOrgId,
    };
  }
  return await prisma.supplementaryReportHistory.findMany({
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
  });
};

export const getSupplementaries = async (myrId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: SupplementaryReportWhereInput = {
    modelYearReportId: myrId,
  };
  if (userIsGov) {
    whereClause.status = {
      not: SupplementaryReportStatus.DRAFT,
    };
  } else {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.supplementaryReport.findMany({
    where: whereClause,
    select: {
      id: true,
      status: true,
      sequenceNumber: true,
    },
    orderBy: {
      sequenceNumber: "asc",
    },
  });
};

export type SupplierData = {
  legalName: string;
  makes: string;
  recordsAddress: string;
  serviceAddress: string;
};

export const getSupplierOwnData = async (): Promise<SupplierData> => {
  const { userOrgId } = await getUserInfo();
  const { legalName, makes, recordsAddress, serviceAddress } =
    await getSupplierDetails(userOrgId);
  return {
    legalName,
    makes: makes.join(", "),
    recordsAddress: recordsAddress ? getAddressAsString(recordsAddress) : "",
    serviceAddress: serviceAddress ? getAddressAsString(serviceAddress) : "",
  };
};

export const getSupplierOwnVehicleStats = async (modelYear: ModelYear) => {
  const { userOrgId } = await getUserInfo();
  return await getVehicleStatistics(userOrgId, modelYear);
};
