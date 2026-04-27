import {
  CreditApplicationStatus,
  CreditTransferStatus,
  ModelYearReportStatus,
  VehicleStatus,
} from "@/prisma/generated/enums";
import { Item, itemsToTake } from "./constants";
import { prisma } from "@/lib/prisma";
import { getIsoYmdString } from "@/app/lib/utils/date";
import {
  getCreditApplicationStatusEnumsToStringsMap,
  getCreditTransferStatusEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Routes } from "@/app/lib/constants";
import { mapOfStatusToSupplierStatus as myrMap } from "@/app/compliance-reporting/lib/model-year-reports/constants";
import { mapOfStatusToSupplierStatus as caMap } from "@/app/zev-unit-activities/lib/credit-applications/constants";
import { mapOfStatusToSupplierStatus as ctMap } from "@/app/zev-unit-activities/lib/credit-transfers/constants";

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
  const myrs = await prisma.creditApplication.findMany({
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
  return myrs.map((ca) => {
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
  const myrs = await prisma.vehicle.findMany({
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
  return myrs.map((vehicle) => {
    return {
      id: vehicle.id,
      timestamp: vehicle.VehicleHistory[0]
        ? getIsoYmdString(vehicle.VehicleHistory[0].timestamp)
        : undefined,
      status: statusMap[vehicle.status] ?? "",
      route: vehicle.isActive
        ? `${Routes.ActiveZevModels}/${vehicle.id}`
        : `${Routes.InactiveZevModels}/${vehicle.id}`,
      cta: "View",
    };
  });
};

export const getSupplierCtActionRequiredItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const myrs = await prisma.creditTransfer.findMany({
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
  return myrs.map((ct) => {
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
  const myrs = await prisma.creditApplication.findMany({
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
  return myrs.map((ca) => {
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
  const myrs = await prisma.vehicle.findMany({
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
  return myrs.map((vehicle) => {
    return {
      id: vehicle.id,
      timestamp: vehicle.VehicleHistory[0]
        ? getIsoYmdString(vehicle.VehicleHistory[0].timestamp)
        : undefined,
      status: statusMap[vehicle.status] ?? "",
      route: vehicle.isActive
        ? `${Routes.ActiveZevModels}/${vehicle.id}`
        : `${Routes.InactiveZevModels}/${vehicle.id}`,
      cta: "View",
    };
  });
};

export const getSupplierCtInProgressItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const myrs = await prisma.creditTransfer.findMany({
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
  return myrs.map((ct) => {
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
  const myrs = await prisma.creditApplication.findMany({
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
  return myrs.map((ca) => {
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
  const myrs = await prisma.vehicle.findMany({
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
  return myrs.map((vehicle) => {
    return {
      id: vehicle.id,
      timestamp: vehicle.VehicleHistory[0]
        ? getIsoYmdString(vehicle.VehicleHistory[0].timestamp)
        : undefined,
      status: statusMap[vehicle.status] ?? "",
      route: vehicle.isActive
        ? `${Routes.ActiveZevModels}/${vehicle.id}`
        : `${Routes.InactiveZevModels}/${vehicle.id}`,
      cta: "View",
    };
  });
};

export const getSupplierCtForAwarenessItems = async (
  userOrgId: number,
  idsToExclude: number[],
): Promise<Item[]> => {
  const myrs = await prisma.creditTransfer.findMany({
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
  return myrs.map((ct) => {
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
