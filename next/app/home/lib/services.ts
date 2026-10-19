import {
  CreditApplicationStatus,
  CreditTransferStatus,
  ModelYearReportStatus,
  Role,
  VehicleStatus,
} from "@/prisma/generated/enums";
import {
  ActivityFeedRecord,
  AllRecordsRecordGov,
  AllRecordsRecordSupplier,
  AllRecordTypeGov,
  AllRecordTypeSupplier,
  Item,
  itemsToTake,
  SerializedActivityFeedRecord,
  SerializedAllRecordsRecordGov,
  SerializedAllRecordsRecordSupplier,
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
import {
  getActivityFeedCaRecordsWhereClause,
  getActivityFeedCreditAgreementRecordsWhereClause,
  getActivityFeedCreditTransferRecordsWhereClause,
  getActivityFeedMyrRecordsWhereClause,
  getActivityFeedPenaltyCreditRecordsWhereClause,
  getActivityFeedZevModelRecordsWhereClause,
  getAllCaRecordsGovWhereClause,
  getAllCaRecordsSupplierWhereClause,
  getAllCreditAgreementRecordsGovWhereClause,
  getAllCreditTransferRecordsGovWhereClause,
  getAllMyrRecordsGovWhereClause,
  getAllPenaltyCreditRecordsGovWhereClause,
  getAllZevModelRecordsGovWhereClause,
  getSerializedActivityFeedRecord,
  getSerializedAllRecordsRecordGov,
  getSerializedAllRecordsRecordSupplier,
} from "./utilsServer";

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

// intended for gov users
export const getAllCaRecordsGov = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const statusesMap = getCreditApplicationStatusEnumsToStringsMap();
  const whereClause = getAllCaRecordsGovWhereClause(userRoles, type);
  if (!whereClause) {
    return [];
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
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  return creditApplications.map((application) => {
    const record: AllRecordsRecordGov = {
      ...application,
      status: statusesMap[application.status] ?? application.status,
      mostRecentHistoryEntry: application.CreditApplicationHistory[0],
    };
    return getSerializedAllRecordsRecordGov(
      "Credit Application",
      record,
      Routes.CreditApplications,
    );
  });
};

// intended for supplier users
export const getAllCaRecordsSupplier = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const statusesMap = getCreditApplicationStatusEnumsToStringsMap();
  const whereClause = getAllCaRecordsSupplierWhereClause(userOrgId, type);
  if (!whereClause) {
    return [];
  }
  const creditApplications = await prisma.creditApplication.findMany({
    where: whereClause,
    select: {
      CreditApplicationHistory: {
        where: {
          userAction: {
            notIn: [
              CreditApplicationStatus.RECOMMEND_APPROVAL,
              CreditApplicationStatus.RETURNED_TO_ANALYST,
            ],
          },
        },
        select: {
          timestamp: true,
        },
        take: 1,
        orderBy: {
          timestamp: "desc",
        },
      },
      id: true,
      supplierStatus: true,
    },
  });
  return creditApplications.map((application) => {
    const record: AllRecordsRecordSupplier = {
      ...application,
      status:
        statusesMap[application.supplierStatus] ?? application.supplierStatus,
      mostRecentHistoryEntry: application.CreditApplicationHistory[0],
    };
    return getSerializedAllRecordsRecordSupplier(
      "Credit Application",
      record,
      Routes.CreditApplications,
    );
  });
};

// intended for gov users
export const getAllZevModelRecordsGov = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const statusesMap = getVehicleStatusEnumsToStringsMap();
  const whereClause = getAllZevModelRecordsGovWhereClause(userRoles, type);
  if (!whereClause) {
    return [];
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
    const record: AllRecordsRecordGov = {
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
    return getSerializedAllRecordsRecordGov("ZEV Model", record, baseRoute);
  });
};

// intended for gov users
export const getAllCreditTransferRecordsGov = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const statusesMap = getCreditTransferStatusEnumsToStringsMap();
  const whereClause = getAllCreditTransferRecordsGovWhereClause(
    userRoles,
    type,
  );
  if (!whereClause) {
    return [];
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
    const record: AllRecordsRecordGov = {
      ...transfer,
      organization: transfer.transferFrom,
      status: statusesMap[transfer.status] ?? transfer.status,
      mostRecentHistoryEntry: transfer.creditTransferHistory[0],
    };
    return getSerializedAllRecordsRecordGov(
      "Credit Transfer",
      record,
      Routes.CreditTransfers,
    );
  });
};

// intended for gov users
export const getAllCreditAgreementRecordsGov = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const statusesMap = getAgreementStatusEnumsToStringsMap();
  const whereClause = getAllCreditAgreementRecordsGovWhereClause(
    userRoles,
    type,
  );
  if (!whereClause) {
    return [];
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
    const record: AllRecordsRecordGov = {
      ...agreement,
      status: statusesMap[agreement.status] ?? agreement.status,
      mostRecentHistoryEntry: agreement.agreementHistory[0],
    };
    return getSerializedAllRecordsRecordGov(
      "Credit Agreement",
      record,
      Routes.CreditAgreements,
    );
  });
};

// intended for gov users
export const getAllPenaltyCreditRecordsGov = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const statusesMap = getPenaltyCreditStatusEnumsToStringsMap();
  const whereClause = getAllPenaltyCreditRecordsGovWhereClause(userRoles, type);
  if (!whereClause) {
    return [];
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
    const record: AllRecordsRecordGov = {
      ...pc,
      status: statusesMap[pc.status] ?? pc.status,
      mostRecentHistoryEntry: pc.PenaltyCreditHistory[0],
    };
    return getSerializedAllRecordsRecordGov(
      "Penalty Credits",
      record,
      Routes.PenaltyCredits,
    );
  });
};

// intended for gov users
export const getAllMyrRecordsGov = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const statusesMap = getMyrStatusEnumsToStringsMap();
  const whereClause = getAllMyrRecordsGovWhereClause(userRoles, type);
  if (!whereClause) {
    return [];
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
    const record: AllRecordsRecordGov = {
      ...myr,
      status: statusesMap[myr.status] ?? myr.status,
      mostRecentHistoryEntry: myr.modelYearReportHistory[0],
    };
    return getSerializedAllRecordsRecordGov(
      "Model Year Report",
      record,
      Routes.ModelYearReports,
    );
  });
};

// intended for gov users
export const getActivityFeedCaRecords = async (
  userRoles: Role[],
): Promise<SerializedActivityFeedRecord[]> => {
  const statusesMap = getCreditApplicationStatusEnumsToStringsMap();
  const whereClause = getActivityFeedCaRecordsWhereClause(userRoles);
  const history = await prisma.creditApplicationHistory.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      userAction: true,
      user: { select: { firstName: true, lastName: true, roles: true } },
      creditApplication: {
        select: { id: true, organization: { select: { name: true } } },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  return history.map((entry) => {
    const record: ActivityFeedRecord = {
      recordId: entry.creditApplication.id,
      recordType: "Credit Application",
      activityType: statusesMap[entry.userAction] ?? entry.userAction,
      supplier: entry.creditApplication.organization.name,
      route: `${Routes.CreditApplications}/${entry.creditApplication.id}`,
      timestamp: entry.timestamp,
      user: entry.user,
    };
    return getSerializedActivityFeedRecord(record);
  });
};

// intended for gov users
export const getActivityFeedZevModelRecords = async (
  userRoles: Role[],
): Promise<SerializedActivityFeedRecord[]> => {
  const statusesMap = getVehicleStatusEnumsToStringsMap();
  const whereClause = getActivityFeedZevModelRecordsWhereClause(userRoles);
  const history = await prisma.vehicleHistory.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      userAction: true,
      user: { select: { firstName: true, lastName: true, roles: true } },
      vehicle: {
        select: {
          id: true,
          status: true,
          isActive: true,
          organization: { select: { name: true } },
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  return history.map((entry) => {
    const record: ActivityFeedRecord = {
      recordId: entry.vehicle.id,
      recordType: "ZEV Model",
      activityType: statusesMap[entry.userAction] ?? entry.userAction,
      supplier: entry.vehicle.organization.name,
      route: getZevModelDetailsRoute(entry.vehicle),
      timestamp: entry.timestamp,
      user: entry.user,
    };
    return getSerializedActivityFeedRecord(record);
  });
};

// intended for gov users
export const getActivityFeedCreditTransferRecords = async (
  userRoles: Role[],
): Promise<SerializedActivityFeedRecord[]> => {
  const statusesMap = getCreditTransferStatusEnumsToStringsMap();
  const whereClause =
    getActivityFeedCreditTransferRecordsWhereClause(userRoles);
  const history = await prisma.creditTransferHistory.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      userAction: true,
      user: { select: { firstName: true, lastName: true, roles: true } },
      creditTransfer: {
        select: { id: true, transferFrom: { select: { name: true } } },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  return history.map((entry) => {
    const record: ActivityFeedRecord = {
      recordId: entry.creditTransfer.id,
      recordType: "Credit Transfer",
      activityType: statusesMap[entry.userAction] ?? entry.userAction,
      supplier: entry.creditTransfer.transferFrom.name,
      route: `${Routes.CreditTransfers}/${entry.creditTransfer.id}`,
      timestamp: entry.timestamp,
      user: entry.user,
    };
    return getSerializedActivityFeedRecord(record);
  });
};

// intended for gov users
export const getActivityFeedCreditAgreementRecords = async (
  userRoles: Role[],
): Promise<SerializedActivityFeedRecord[]> => {
  const statusesMap = getAgreementStatusEnumsToStringsMap();
  const whereClause =
    getActivityFeedCreditAgreementRecordsWhereClause(userRoles);
  const history = await prisma.agreementHistory.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      userAction: true,
      user: { select: { firstName: true, lastName: true, roles: true } },
      agreement: {
        select: { id: true, organization: { select: { name: true } } },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  return history.map((entry) => {
    const record: ActivityFeedRecord = {
      recordId: entry.agreement.id,
      recordType: "Credit Agreement",
      activityType: statusesMap[entry.userAction] ?? entry.userAction,
      supplier: entry.agreement.organization.name,
      route: `${Routes.CreditAgreements}/${entry.agreement.id}`,
      timestamp: entry.timestamp,
      user: entry.user,
    };
    return getSerializedActivityFeedRecord(record);
  });
};

// intended for gov users
export const getActivityFeedPenaltyCreditRecords = async (
  userRoles: Role[],
): Promise<SerializedActivityFeedRecord[]> => {
  const statusesMap = getPenaltyCreditStatusEnumsToStringsMap();
  const whereClause = getActivityFeedPenaltyCreditRecordsWhereClause(userRoles);
  const history = await prisma.penaltyCreditHistory.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      userAction: true,
      user: { select: { firstName: true, lastName: true, roles: true } },
      penaltyCredit: {
        select: { id: true, organization: { select: { name: true } } },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  return history.map((entry) => {
    const record: ActivityFeedRecord = {
      recordId: entry.penaltyCredit.id,
      recordType: "Penalty Credits",
      activityType: statusesMap[entry.userAction] ?? entry.userAction,
      supplier: entry.penaltyCredit.organization.name,
      route: `${Routes.PenaltyCredits}/${entry.penaltyCredit.id}`,
      timestamp: entry.timestamp,
      user: entry.user,
    };
    return getSerializedActivityFeedRecord(record);
  });
};

// intended for gov users
export const getActivityFeedMyrRecords = async (
  userRoles: Role[],
): Promise<SerializedActivityFeedRecord[]> => {
  const statusesMap = getMyrStatusEnumsToStringsMap();
  const whereClause = getActivityFeedMyrRecordsWhereClause(userRoles);
  const history = await prisma.modelYearReportHistory.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      userAction: true,
      user: { select: { firstName: true, lastName: true, roles: true } },
      modelYearReport: {
        select: { id: true, organization: { select: { name: true } } },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  return history.map((entry) => {
    const record: ActivityFeedRecord = {
      recordId: entry.modelYearReport.id,
      recordType: "Model Year Report",
      activityType: statusesMap[entry.userAction] ?? entry.userAction,
      supplier: entry.modelYearReport.organization.name,
      route: `${Routes.ModelYearReports}/${entry.modelYearReport.id}`,
      timestamp: entry.timestamp,
      user: entry.user,
    };
    return getSerializedActivityFeedRecord(record);
  });
};

export const getRecentActivityFeedRecords = async (
  userRoles: Role[],
  limit: number,
): Promise<SerializedActivityFeedRecord[]> => {
  const collection = await Promise.all([
    getActivityFeedCaRecords(userRoles),
    getActivityFeedZevModelRecords(userRoles),
    getActivityFeedCreditTransferRecords(userRoles),
    getActivityFeedCreditAgreementRecords(userRoles),
    getActivityFeedPenaltyCreditRecords(userRoles),
    getActivityFeedMyrRecords(userRoles),
  ]);
  const records = collection.flat();
  records.sort((a, b) => {
    if (b.sortKey > a.sortKey) {
      return 1;
    }
    if (b.sortKey < a.sortKey) {
      return -1;
    }
    return 0;
  });
  return records.slice(0, limit);
};

export const getGovRecords = async (
  userRoles: Role[],
  type: AllRecordTypeGov,
): Promise<SerializedAllRecordsRecordGov[]> => {
  const [cas, zevModels, cts, agreements, pcs, myrs] = await Promise.all([
    getAllCaRecordsGov(userRoles, type),
    getAllZevModelRecordsGov(userRoles, type),
    getAllCreditTransferRecordsGov(userRoles, type),
    getAllCreditAgreementRecordsGov(userRoles, type),
    getAllPenaltyCreditRecordsGov(userRoles, type),
    getAllMyrRecordsGov(userRoles, type),
  ]);
  return [...cas, ...zevModels, ...cts, ...agreements, ...pcs, ...myrs];
};
