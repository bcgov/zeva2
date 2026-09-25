import {
  AgreementStatus,
  CreditApplicationStatus,
  CreditTransferStatus,
  ModelYearReportStatus,
  PenaltyCreditStatus,
  Role,
  VehicleStatus,
} from "@/prisma/generated/enums";
import {
  AllRecordsRecord,
  Item,
  itemsToTake,
  SerializedAllRecordsRecord,
} from "./constants";
import { prisma } from "@/lib/prisma";
import { getIsoYmdString } from "@/app/lib/utils/date";
import {
  getAgreementStatusEnumsToStringsMap,
  getCreditApplicationStatusEnumsToStringsMap,
  getCreditTransferStatusEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
  getPenaltyCreditStatusEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Routes } from "@/app/lib/constants";
import { mapOfStatusToSupplierStatus as myrMap } from "@/app/compliance-reporting/lib/model-year-reports/constants";
import { mapOfStatusToSupplierStatus as caMap } from "@/app/zev-unit-activities/lib/credit-applications/constants";
import { mapOfStatusToSupplierStatus as ctMap } from "@/app/zev-unit-activities/lib/credit-transfers/constants";
import { getZevModelDetailsRoute } from "@/app/zev-models/lib/routes";
import { getSerializedAllRecordsRecord, getThirtyDaysAgo } from "./utilsServer";
import {
  AgreementWhereInput,
  CreditApplicationWhereInput,
  CreditTransferWhereInput,
  ModelYearReportWhereInput,
  PenaltyCreditWhereInput,
  VehicleWhereInput,
} from "@/prisma/generated/models";

export const getSupplierActionRequiredCounts = async (userOrgId: number) => {
  const myrPromise = prisma.modelYearReport.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
  });
  const caPromise = prisma.creditApplication.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [CreditApplicationStatus.DRAFT],
      },
    },
  });
  const zevModelPromise = prisma.vehicle.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
      },
    },
  });
  const transferPromise = prisma.creditTransfer.count({
    where: {
      OR: [
        {
          transferFromId: userOrgId,
          status: { in: [CreditTransferStatus.DRAFT] },
        },
        {
          transferToId: userOrgId,
          status: { in: [CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO] },
        },
      ],
    },
  });
  const [myrCount, caCount, zevModelCount, transferCount] = await Promise.all([
    myrPromise,
    caPromise,
    zevModelPromise,
    transferPromise,
  ]);
  return {
    "Model Year Reports": myrCount,
    "Credit Applications": caCount,
    "ZEV Models": zevModelCount,
    "Credit Transfers": transferCount,
  };
};

export const getSupplierInProgressCounts = async (userOrgId: number) => {
  const myrPromise = prisma.modelYearReport.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          ModelYearReportStatus.RETURNED_TO_ANALYST,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
        ],
      },
    },
  });
  const caPromise = prisma.creditApplication.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.RETURNED_TO_ANALYST,
          CreditApplicationStatus.SUBMITTED,
        ],
      },
    },
  });
  const zevModelPromise = prisma.vehicle.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.SUBMITTED],
      },
    },
  });
  const transferPromise = prisma.creditTransfer.count({
    where: {
      OR: [
        {
          transferFromId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
              CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
              CreditTransferStatus.RECOMMEND_REJECTION_GOV,
              CreditTransferStatus.RETURNED_TO_ANALYST,
              CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
            ],
          },
        },
        {
          transferToId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
              CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
              CreditTransferStatus.RECOMMEND_REJECTION_GOV,
              CreditTransferStatus.RETURNED_TO_ANALYST,
            ],
          },
        },
      ],
    },
  });
  const [myrCount, caCount, zevModelCount, transferCount] = await Promise.all([
    myrPromise,
    caPromise,
    zevModelPromise,
    transferPromise,
  ]);
  return {
    "Model Year Reports": myrCount,
    "Credit Applications": caCount,
    "ZEV Models": zevModelCount,
    "Credit Transfers": transferCount,
  };
};

export const getSupplierAwarenessCounts = async (userOrgId: number) => {
  const myrPromise = prisma.modelYearReport.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [ModelYearReportStatus.ASSESSED],
      },
    },
  });
  const caPromise = prisma.creditApplication.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          CreditApplicationStatus.APPROVED,
          CreditApplicationStatus.REJECTED,
        ],
      },
    },
  });
  const zevModelPromise = prisma.vehicle.count({
    where: {
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.VALIDATED],
      },
    },
  });
  const transferPromise = prisma.creditTransfer.count({
    where: {
      OR: [
        {
          transferFromId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
              CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
            ],
          },
        },
        {
          transferToId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
              CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
            ],
          },
        },
      ],
    },
  });
  const [myrCount, caCount, zevModelCount, transferCount] = await Promise.all([
    myrPromise,
    caPromise,
    zevModelPromise,
    transferPromise,
  ]);
  return {
    "Model Year Reports": myrCount,
    "Credit Applications": caCount,
    "ZEV Models": zevModelCount,
    "Credit Transfers": transferCount,
  };
};

export const getSupplierMyrActionRequiredItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const myrs = await prisma.modelYearReport.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      modelYearReportHistory: {
        where: {
          userAction: {
            in: [
              ModelYearReportStatus.DRAFT,
              ModelYearReportStatus.RETURNED_TO_SUPPLIER,
            ],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getMyrStatusEnumsToStringsMap();
  return myrs.map((myr) => {
    return {
      id: myr.id,
      timestamp: myr.modelYearReportHistory[0]
        ? getIsoYmdString(myr.modelYearReportHistory[0].timestamp)
        : undefined,
      status: statusMap[myrMap[myr.status]] ?? "",
      route: `${Routes.ModelYearReports}/${myr.id}`,
      cta: "View",
    };
  });
};

export const getSupplierCaActionRequiredItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const cas = await prisma.creditApplication.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [CreditApplicationStatus.DRAFT],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      CreditApplicationHistory: {
        where: {
          userAction: {
            in: [CreditApplicationStatus.DRAFT],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getCreditApplicationStatusEnumsToStringsMap();
  return cas.map((ca) => {
    return {
      id: ca.id,
      timestamp: ca.CreditApplicationHistory[0]
        ? getIsoYmdString(ca.CreditApplicationHistory[0].timestamp)
        : undefined,
      status: statusMap[caMap[ca.status]] ?? "",
      route: `${Routes.CreditApplications}/${ca.id}`,
      cta: "View",
    };
  });
};

export const getSupplierZevModelActionRequiredItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      isActive: true,
      VehicleHistory: {
        where: {
          userAction: {
            in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getVehicleStatusEnumsToStringsMap();
  return vehicles.map((vehicle) => {
    return {
      id: vehicle.id,
      timestamp: vehicle.VehicleHistory[0]
        ? getIsoYmdString(vehicle.VehicleHistory[0].timestamp)
        : undefined,
      status: statusMap[vehicle.status] ?? "",
      route: getZevModelDetailsRoute(vehicle),
      cta: "View",
    };
  });
};

export const getSupplierCtActionRequiredItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const cts = await prisma.creditTransfer.findMany({
    where: {
      OR: [
        {
          transferFromId: userOrgId,
          status: { in: [CreditTransferStatus.DRAFT] },
        },
        {
          transferToId: userOrgId,
          status: { in: [CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO] },
        },
      ],
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      creditTransferHistory: {
        where: {
          userAction: {
            in: [
              CreditTransferStatus.DRAFT,
              CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
            ],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getCreditTransferStatusEnumsToStringsMap();
  return cts.map((ct) => {
    return {
      id: ct.id,
      timestamp: ct.creditTransferHistory[0]
        ? getIsoYmdString(ct.creditTransferHistory[0].timestamp)
        : undefined,
      status: statusMap[ctMap[ct.status]] ?? "",
      route: `${Routes.CreditTransfers}/${ct.id}`,
      cta: "View",
    };
  });
};

export const getSupplierMyrInProgressItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const myrs = await prisma.modelYearReport.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          ModelYearReportStatus.RETURNED_TO_ANALYST,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
        ],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      modelYearReportHistory: {
        where: {
          userAction: {
            in: [ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getMyrStatusEnumsToStringsMap();
  return myrs.map((myr) => {
    return {
      id: myr.id,
      timestamp: myr.modelYearReportHistory[0]
        ? getIsoYmdString(myr.modelYearReportHistory[0].timestamp)
        : undefined,
      status: statusMap[myrMap[myr.status]] ?? "",
      route: `${Routes.ModelYearReports}/${myr.id}`,
      cta: "View",
    };
  });
};

export const getSupplierCaInProgressItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const cas = await prisma.creditApplication.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.RETURNED_TO_ANALYST,
          CreditApplicationStatus.SUBMITTED,
        ],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      CreditApplicationHistory: {
        where: {
          userAction: {
            in: [CreditApplicationStatus.SUBMITTED],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getCreditApplicationStatusEnumsToStringsMap();
  return cas.map((ca) => {
    return {
      id: ca.id,
      timestamp: ca.CreditApplicationHistory[0]
        ? getIsoYmdString(ca.CreditApplicationHistory[0].timestamp)
        : undefined,
      status: statusMap[caMap[ca.status]] ?? "",
      route: `${Routes.CreditApplications}/${ca.id}`,
      cta: "View",
    };
  });
};

export const getSupplierZevModelInProgressItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.SUBMITTED],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      isActive: true,
      VehicleHistory: {
        where: {
          userAction: {
            in: [VehicleStatus.SUBMITTED],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getVehicleStatusEnumsToStringsMap();
  return vehicles.map((vehicle) => {
    return {
      id: vehicle.id,
      timestamp: vehicle.VehicleHistory[0]
        ? getIsoYmdString(vehicle.VehicleHistory[0].timestamp)
        : undefined,
      status: statusMap[vehicle.status] ?? "",
      route: getZevModelDetailsRoute(vehicle),
      cta: "View",
    };
  });
};

export const getSupplierCtInProgressItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const cts = await prisma.creditTransfer.findMany({
    where: {
      OR: [
        {
          transferFromId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
              CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
              CreditTransferStatus.RECOMMEND_REJECTION_GOV,
              CreditTransferStatus.RETURNED_TO_ANALYST,
              CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
            ],
          },
        },
        {
          transferToId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
              CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
              CreditTransferStatus.RECOMMEND_REJECTION_GOV,
              CreditTransferStatus.RETURNED_TO_ANALYST,
            ],
          },
        },
      ],
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      creditTransferHistory: {
        where: {
          userAction: {
            in: [
              CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
              CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
            ],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getCreditTransferStatusEnumsToStringsMap();
  return cts.map((ct) => {
    return {
      id: ct.id,
      timestamp: ct.creditTransferHistory[0]
        ? getIsoYmdString(ct.creditTransferHistory[0].timestamp)
        : undefined,
      status: statusMap[ctMap[ct.status]] ?? "",
      route: `${Routes.CreditTransfers}/${ct.id}`,
      cta: "View",
    };
  });
};

export const getSupplierMyrForAwarenessItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const myrs = await prisma.modelYearReport.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [ModelYearReportStatus.ASSESSED],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      modelYearReportHistory: {
        where: {
          userAction: {
            in: [ModelYearReportStatus.ASSESSED],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getMyrStatusEnumsToStringsMap();
  return myrs.map((myr) => {
    return {
      id: myr.id,
      timestamp: myr.modelYearReportHistory[0]
        ? getIsoYmdString(myr.modelYearReportHistory[0].timestamp)
        : undefined,
      status: statusMap[myrMap[myr.status]] ?? "",
      route: `${Routes.ModelYearReports}/${myr.id}`,
      cta: "View",
    };
  });
};

export const getSupplierCaForAwarenessItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const cas = await prisma.creditApplication.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [
          CreditApplicationStatus.APPROVED,
          CreditApplicationStatus.REJECTED,
        ],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      CreditApplicationHistory: {
        where: {
          userAction: {
            in: [
              CreditApplicationStatus.APPROVED,
              CreditApplicationStatus.REJECTED,
            ],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getCreditApplicationStatusEnumsToStringsMap();
  return cas.map((ca) => {
    return {
      id: ca.id,
      timestamp: ca.CreditApplicationHistory[0]
        ? getIsoYmdString(ca.CreditApplicationHistory[0].timestamp)
        : undefined,
      status: statusMap[caMap[ca.status]] ?? "",
      route: `${Routes.CreditApplications}/${ca.id}`,
      cta: "View",
    };
  });
};

export const getSupplierZevModelForAwarenessItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: userOrgId,
      status: {
        in: [VehicleStatus.VALIDATED],
      },
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      isActive: true,
      VehicleHistory: {
        where: {
          userAction: {
            in: [VehicleStatus.VALIDATED],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getVehicleStatusEnumsToStringsMap();
  return vehicles.map((vehicle) => {
    return {
      id: vehicle.id,
      timestamp: vehicle.VehicleHistory[0]
        ? getIsoYmdString(vehicle.VehicleHistory[0].timestamp)
        : undefined,
      status: statusMap[vehicle.status] ?? "",
      route: getZevModelDetailsRoute(vehicle),
      cta: "View",
    };
  });
};

export const getSupplierCtForAwarenessItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const cts = await prisma.creditTransfer.findMany({
    where: {
      OR: [
        {
          transferFromId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
              CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
            ],
          },
        },
        {
          transferToId: userOrgId,
          status: {
            in: [
              CreditTransferStatus.APPROVED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
              CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
            ],
          },
        },
      ],
      id: {
        notIn: idsToExclude,
      },
    },
    select: {
      id: true,
      status: true,
      creditTransferHistory: {
        where: {
          userAction: {
            in: [
              CreditTransferStatus.APPROVED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_GOV,
              CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
              CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
            ],
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        select: {
          timestamp: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    take: itemsToTake,
  });
  const statusMap = getCreditTransferStatusEnumsToStringsMap();
  return cts.map((ct) => {
    return {
      id: ct.id,
      timestamp: ct.creditTransferHistory[0]
        ? getIsoYmdString(ct.creditTransferHistory[0].timestamp)
        : undefined,
      status: statusMap[ctMap[ct.status]] ?? "",
      route: `${Routes.CreditTransfers}/${ct.id}`,
      cta: "View",
    };
  });
};

export const getAllCaRecords = async (
  userIsGov: boolean,
  userRoles: Role[],
  userOrgId?: number,
): Promise<SerializedAllRecordsRecord[]> => {
  if (!userIsGov && !userOrgId) {
    throw new Error("Incorrect arguments!");
  }
  const thirtyDaysAgo = getThirtyDaysAgo();
  const statusesMap = getCreditApplicationStatusEnumsToStringsMap();
  const whereClause: CreditApplicationWhereInput = {
    CreditApplicationHistory: {
      some: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    },
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          CreditApplicationStatus.APPROVED,
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.REJECTED,
        ],
      };
    } else {
      whereClause.status = {
        in: [
          CreditApplicationStatus.APPROVED,
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.REJECTED,
          CreditApplicationStatus.RETURNED_TO_ANALYST,
          CreditApplicationStatus.SUBMITTED,
        ],
      };
    }
  } else if (userOrgId) {
    whereClause.organizationId = userOrgId;
  }
  const creditApplications = await prisma.creditApplication.findMany({
    where: whereClause,
    select: {
      CreditApplicationHistory: {
        select: {
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      status: true,
      supplierStatus: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  return creditApplications.map((application) => {
    const statusToUse = userIsGov
      ? application.status
      : application.supplierStatus;
    const record: AllRecordsRecord = {
      ...application,
      status: statusesMap[statusToUse] ?? statusToUse,
      mostRecentHistoryEntry: application.CreditApplicationHistory[0],
    };
    return getSerializedAllRecordsRecord(
      "Credit Application",
      record,
      Routes.CreditApplications,
    );
  });
};

export const getAllZevModelRecords = async (
  userIsGov: boolean,
  userRoles: Role[],
  userOrgId?: number,
): Promise<SerializedAllRecordsRecord[]> => {
  if (!userIsGov && !userOrgId) {
    throw new Error("Incorrect arguments!");
  }
  const thirtyDaysAgo = getThirtyDaysAgo();
  const statusesMap = getVehicleStatusEnumsToStringsMap();
  const whereClause: VehicleWhereInput = {
    VehicleHistory: {
      some: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    },
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [VehicleStatus.VALIDATED],
      };
    } else {
      whereClause.status = {
        in: [VehicleStatus.SUBMITTED, VehicleStatus.VALIDATED],
      };
    }
  } else if (userOrgId) {
    whereClause.organizationId = userOrgId;
  }
  const vehicles = await prisma.vehicle.findMany({
    where: whereClause,
    select: {
      VehicleHistory: {
        select: {
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      status: true,
      organization: {
        select: {
          name: true,
        },
      },
      isActive: true,
    },
  });
  return vehicles.map((vehicle) => {
    const record: AllRecordsRecord = {
      ...vehicle,
      status: statusesMap[vehicle.status] ?? vehicle.status,
      mostRecentHistoryEntry: vehicle.VehicleHistory[0],
    };
    let baseRoute = Routes.ValidatedZevModels;
    if (vehicle.isActive && vehicle.status !== VehicleStatus.VALIDATED) {
      baseRoute = Routes.SubmittedZevModels;
    } else {
      baseRoute = Routes.InactiveZevModels;
    }
    return getSerializedAllRecordsRecord("ZEV Model", record, baseRoute);
  });
};

export const getAllCreditTransferRecords = async (
  userIsGov: boolean,
  userRoles: Role[],
  userOrgId?: number,
): Promise<SerializedAllRecordsRecord[]> => {
  if (!userIsGov && !userOrgId) {
    throw new Error("Incorrect arguments!");
  }
  const thirtyDaysAgo = getThirtyDaysAgo();
  const statusesMap = getCreditTransferStatusEnumsToStringsMap();
  const whereClause: CreditTransferWhereInput = {
    creditTransferHistory: {
      some: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    },
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          CreditTransferStatus.APPROVED_BY_GOV,
          CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
          CreditTransferStatus.RECOMMEND_REJECTION_GOV,
          CreditTransferStatus.REJECTED_BY_GOV,
        ],
      };
    } else {
      whereClause.status = {
        notIn: [
          CreditTransferStatus.DRAFT,
          CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
          CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
          CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        ],
      };
    }
  } else if (userOrgId) {
    whereClause.OR = [
      { transferFromId: userOrgId },
      { transferToId: userOrgId, status: { not: CreditTransferStatus.DRAFT } },
    ];
  }
  const transfers = await prisma.creditTransfer.findMany({
    where: whereClause,
    select: {
      creditTransferHistory: {
        select: {
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      status: true,
      transferFrom: {
        select: {
          name: true,
        },
      },
    },
  });
  return transfers.map((transfer) => {
    const statusToUse = userIsGov ? transfer.status : ctMap[transfer.status];
    const record: AllRecordsRecord = {
      ...transfer,
      organization: transfer.transferFrom,
      status: statusesMap[statusToUse] ?? statusToUse,
      mostRecentHistoryEntry: transfer.creditTransferHistory[0],
    };
    return getSerializedAllRecordsRecord(
      "Credit Transfer",
      record,
      Routes.CreditTransfers,
    );
  });
};

export const getAllCreditAgreementRecords = async (
  userIsGov: boolean,
  userRoles: Role[],
  userOrgId?: number,
): Promise<SerializedAllRecordsRecord[]> => {
  if (!userIsGov && !userOrgId) {
    throw new Error("Incorrect arguments!");
  }
  const thirtyDaysAgo = getThirtyDaysAgo();
  const statusesMap = getAgreementStatusEnumsToStringsMap();
  const whereClause: AgreementWhereInput = {
    agreementHistory: {
      some: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    },
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      in: [AgreementStatus.ISSUED, AgreementStatus.RECOMMEND_APPROVAL],
    };
  } else if (userOrgId) {
    whereClause.organizationId = userOrgId;
    whereClause.status = AgreementStatus.ISSUED;
  }
  const agreements = await prisma.agreement.findMany({
    where: whereClause,
    select: {
      agreementHistory: {
        select: {
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      status: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  return agreements.map((agreement) => {
    const record: AllRecordsRecord = {
      ...agreement,
      status: statusesMap[agreement.status] ?? agreement.status,
      mostRecentHistoryEntry: agreement.agreementHistory[0],
    };
    return getSerializedAllRecordsRecord(
      "Credit Agreement",
      record,
      Routes.CreditAgreements,
    );
  });
};

export const getAllPenaltyCreditRecords = async (
  userIsGov: boolean,
  userRoles: Role[],
  userOrgId?: number,
): Promise<SerializedAllRecordsRecord[]> => {
  if (!userIsGov && !userOrgId) {
    throw new Error("Incorrect arguments!");
  }
  const thirtyDaysAgo = getThirtyDaysAgo();
  const statusesMap = getPenaltyCreditStatusEnumsToStringsMap();
  const whereClause: PenaltyCreditWhereInput = {
    PenaltyCreditHistory: {
      some: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    },
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      in: [
        PenaltyCreditStatus.APPROVED,
        PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      ],
    };
  } else if (userOrgId) {
    whereClause.organizationId = userOrgId;
    whereClause.status = PenaltyCreditStatus.APPROVED;
  }
  const penaltyCredits = await prisma.penaltyCredit.findMany({
    where: whereClause,
    select: {
      PenaltyCreditHistory: {
        select: {
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      status: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  return penaltyCredits.map((pc) => {
    const record: AllRecordsRecord = {
      ...pc,
      status: statusesMap[pc.status] ?? pc.status,
      mostRecentHistoryEntry: pc.PenaltyCreditHistory[0],
    };
    return getSerializedAllRecordsRecord(
      "Penalty Credits",
      record,
      Routes.PenaltyCredits,
    );
  });
};

export const getAllMyrRecords = async (
  userIsGov: boolean,
  userRoles: Role[],
  userOrgId?: number,
): Promise<SerializedAllRecordsRecord[]> => {
  if (!userIsGov && !userOrgId) {
    throw new Error("Incorrect arguments!");
  }
  const thirtyDaysAgo = getThirtyDaysAgo();
  const statusesMap = getMyrStatusEnumsToStringsMap();
  const whereClause: ModelYearReportWhereInput = {
    modelYearReportHistory: {
      some: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    },
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          ModelYearReportStatus.ASSESSED,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ],
      };
    } else {
      whereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
  } else if (userOrgId) {
    whereClause.organizationId = userOrgId;
  }
  const myrs = await prisma.modelYearReport.findMany({
    where: whereClause,
    select: {
      modelYearReportHistory: {
        select: {
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              roles: true,
            },
          },
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      status: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  return myrs.map((myr) => {
    const statusToUse = userIsGov ? myr.status : myrMap[myr.status];
    const record: AllRecordsRecord = {
      ...myr,
      status: statusesMap[statusToUse] ?? myr.status,
      mostRecentHistoryEntry: myr.modelYearReportHistory[0],
    };
    return getSerializedAllRecordsRecord(
      "Model Year Report",
      record,
      Routes.ModelYearReports,
    );
  });
};
