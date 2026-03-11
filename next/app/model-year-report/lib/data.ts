import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  ModelYearReportStatus,
  ReassessmentStatus,
  Role,
} from "@/prisma/generated/enums";
import {
  ModelYearReportWhereUniqueInput,
  ModelYearReportHistoryWhereInput,
  ModelYearReportWhereInput,
  ReassessmentWhereUniqueInput,
  ReassessmentHistoryWhereInput,
  ReassessmentWhereInput,
  SupplementaryReportWhereUniqueInput,
  SupplementaryReportHistoryWhereInput,
  SupplementaryReportWhereInput,
} from "@/prisma/generated/models";
import { getObjectAsBuffer } from "@/app/lib/services/s3";
import { getSupplierDetails, getVehicleStatistics } from "./services";
import { getAddressAsString } from "./utils";
import { MyrRecord } from "./constants";

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
      in: [
        ModelYearReportStatus.ASSESSED,
        ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      ],
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
      objectName: true,
      forecastReportObjectName: true,
      modelYear: true,
    },
  });
  if (!myr) {
    return null;
  }
  const myrFile = await getObjectAsBuffer(myr.objectName);
  const forecastFile = await getObjectAsBuffer(myr.forecastReportObjectName);
  return {
    status: myr.status,
    myrFile,
    forecastFile,
    modelYear: myr.modelYear,
  };
};

export const getModelYearReports = async (): Promise<MyrRecord[]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: ModelYearReportWhereInput = {};
  const reassessmentWhereClause: ReassessmentWhereInput = {};
  const suppWhereClause: SupplementaryReportWhereInput = {};
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.NOT = {
        status: {
          in: [
            ModelYearReportStatus.DRAFT,
            ModelYearReportStatus.RETURNED_TO_ANALYST,
            ModelYearReportStatus.RETURNED_TO_SUPPLIER,
            ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          ],
        },
      };
      reassessmentWhereClause.status = {
        in: [
          ReassessmentStatus.ISSUED,
          ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
        ],
      };
      suppWhereClause.status = {
        in: [
          ModelYearReportStatus.ASSESSED,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ],
      };
    } else {
      whereClause.NOT = {
        status: {
          in: [
            ModelYearReportStatus.DRAFT,
            ModelYearReportStatus.RETURNED_TO_SUPPLIER,
          ],
        },
      };
      suppWhereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
  } else {
    whereClause.organizationId = userOrgId;
    reassessmentWhereClause.status = ReassessmentStatus.ISSUED;
  }
  return await prisma.modelYearReport.findMany({
    where: whereClause,
    select: {
      id: true,
      modelYear: true,
      status: true,
      compliant: true,
      reportableNvValue: true,
      supplierClass: true,
      organization: {
        select: {
          name: true,
        },
      },
      reassessments: {
        where: reassessmentWhereClause,
        select: {
          status: true,
        },
        orderBy: {
          id: "desc",
        },
      },
      supplementaryReports: {
        where: suppWhereClause,
        select: {
          status: true,
        },
        orderBy: {
          id: "desc",
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
};

export const getAssessment = async (myrId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let whereClause: ModelYearReportWhereInput = {};
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          ModelYearReportStatus.ASSESSED,
        ],
      };
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      whereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
  } else {
    whereClause.organizationId = userOrgId;
    whereClause.status = ModelYearReportStatus.ASSESSED;
  }
  const assessment = await prisma.assessment.findUnique({
    where: {
      modelYearReportId: myrId,
      modelYearReport: whereClause,
    },
  });
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
      id: "asc",
    },
  });
};

export const getSupplementaryReport = async (suppId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: SupplementaryReportWhereUniqueInput = {
    id: suppId,
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          ModelYearReportStatus.ASSESSED,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ],
      };
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      whereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
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
      supplementaryReportReassessment: {
        select: {
          objectName: true,
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
  if (!userIsGov) {
    whereClause.supplementaryReport = {
      organizationId: userOrgId,
    };
    whereClause.userAction = {
      notIn: [
        ModelYearReportStatus.RETURNED_TO_ANALYST,
        ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      ],
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
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: SupplementaryReportWhereInput = {
    modelYearReportId: myrId,
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          ModelYearReportStatus.ASSESSED,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ],
      };
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      whereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
  } else {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.supplementaryReport.findMany({
    where: whereClause,
    select: {
      id: true,
      status: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getSuppReassessment = async (suppId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let whereClause: SupplementaryReportWhereInput = {};
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          ModelYearReportStatus.ASSESSED,
        ],
      };
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      whereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
  } else {
    whereClause.organizationId = userOrgId;
    whereClause.status = ModelYearReportStatus.ASSESSED;
  }
  const suppReassessment =
    await prisma.supplementaryReportReassessment.findUnique({
      where: {
        supplementaryReportId: suppId,
        supplementaryReport: whereClause,
      },
    });
  return suppReassessment;
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
