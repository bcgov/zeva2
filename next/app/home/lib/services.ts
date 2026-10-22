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
  SerializedActivityFeedRecord,
  SerializedAllRecordsRecordGov,
  SerializedAllRecordsRecordSupplier,
} from "./constants";
import { prisma } from "@/lib/prisma";
import {
  getAgreementStatusEnumsToStringsMap,
  getCreditApplicationStatusEnumsToStringsMap,
  getCreditTransferStatusEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
  getPenaltyCreditStatusEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Routes } from "@/app/lib/constants";
import { mapOfStatusToSupplierStatus as myrMapOfStatusToSupplierStatus } from "@/app/compliance-reporting/lib/model-year-reports/constants";
import { mapOfStatusToSupplierStatus as caMapOfStatusToSupplierStatus } from "@/app/zev-unit-activities/lib/credit-applications/constants";
import { mapOfStatusToSupplierStatus as ctMapOfStatusToSupplierStatus } from "@/app/zev-unit-activities/lib/credit-transfers/constants";
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
  getAllCreditTransferRecordsSupplierWhereClause,
  getAllMyrRecordsSupplierWhereClause,
  getAllZevModelRecordsSupplierWhereClause,
  getAllCreditAgreementRecordsGovWhereClause,
  getAllCreditTransferRecordsGovWhereClause,
  getAllMyrRecordsGovWhereClause,
  getAllPenaltyCreditRecordsGovWhereClause,
  getAllZevModelRecordsGovWhereClause,
  getSerializedActivityFeedRecord,
  getSerializedAllRecordsRecordGov,
  getSerializedAllRecordsRecordSupplier,
  getAllCreditAgreementRecordsSupplierWhereClause,
  getAllPenaltyCreditRecordsSupplierWhereClause,
} from "./utilsServer";

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
      status: true,
    },
  });
  return creditApplications.map((application) => {
    const record: AllRecordsRecordSupplier = {
      id: application.id,
      status:
        statusesMap[caMapOfStatusToSupplierStatus[application.status]] ?? "",
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
    let baseRoute;
    if (vehicle.status === VehicleStatus.VALIDATED) {
      if (vehicle.isActive) {
        baseRoute = Routes.ValidatedZevModels;
      } else {
        baseRoute = Routes.InactiveZevModels;
      }
    } else {
      baseRoute = Routes.SubmittedZevModels;
    }
    return getSerializedAllRecordsRecordGov("ZEV Model", record, baseRoute);
  });
};

// intended for supplier users
export const getAllZevModelRecordsSupplier = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const statusesMap = getVehicleStatusEnumsToStringsMap();
  const whereClause = getAllZevModelRecordsSupplierWhereClause(userOrgId, type);
  if (!whereClause) {
    return [];
  }
  const vehicles = await prisma.vehicle.findMany({
    where: whereClause,
    select: {
      VehicleHistory: {
        select: { timestamp: true },
        take: 1,
        orderBy: { timestamp: "desc" },
      },
      id: true,
      status: true,
      isActive: true,
    },
  });
  return vehicles.map((vehicle) => {
    let baseRoute;
    if (vehicle.status === VehicleStatus.VALIDATED) {
      if (vehicle.isActive) {
        baseRoute = Routes.ValidatedZevModels;
      } else {
        baseRoute = Routes.InactiveZevModels;
      }
    } else {
      baseRoute = Routes.InProgressZevModels;
    }
    return getSerializedAllRecordsRecordSupplier(
      "ZEV Model",
      {
        id: vehicle.id,
        status: statusesMap[vehicle.status] ?? "",
        mostRecentHistoryEntry: vehicle.VehicleHistory[0],
      },
      baseRoute,
    );
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

// intended for supplier users
export const getAllCreditTransferRecordsSupplier = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const statusesMap = getCreditTransferStatusEnumsToStringsMap();
  const whereClause = getAllCreditTransferRecordsSupplierWhereClause(
    userOrgId,
    type,
  );
  if (!whereClause) {
    return [];
  }
  const transfers = await prisma.creditTransfer.findMany({
    where: whereClause,
    select: {
      creditTransferHistory: {
        where: {
          userAction: {
            notIn: [
              CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
              CreditTransferStatus.RECOMMEND_REJECTION_GOV,
              CreditTransferStatus.RETURNED_TO_ANALYST,
            ],
          },
        },
        select: { timestamp: true, userAction: true },
        take: 1,
        orderBy: { timestamp: "desc" },
      },
      id: true,
      status: true,
    },
  });
  return transfers.map((transfer) => {
    return getSerializedAllRecordsRecordSupplier(
      "Credit Transfer",
      {
        id: transfer.id,
        status:
          statusesMap[ctMapOfStatusToSupplierStatus[transfer.status]] ?? "",
        mostRecentHistoryEntry: transfer.creditTransferHistory[0],
      },
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

// intended for supplier users
export const getAllCreditAgreementRecordsSupplier = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const statusesMap = getAgreementStatusEnumsToStringsMap();
  const whereClause = getAllCreditAgreementRecordsSupplierWhereClause(
    userOrgId,
    type,
  );
  if (!whereClause) {
    return [];
  }
  const agreements = await prisma.agreement.findMany({
    where: whereClause,
    select: {
      agreementHistory: {
        select: { timestamp: true },
        take: 1,
        orderBy: { timestamp: "desc" },
      },
      id: true,
      status: true,
    },
  });
  return agreements.map((agreement) => {
    return getSerializedAllRecordsRecordSupplier(
      "Credit Agreement",
      {
        id: agreement.id,
        status: statusesMap[agreement.status] ?? "",
        mostRecentHistoryEntry: agreement.agreementHistory[0],
      },
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

// intended for supplier users
export const getAllPenaltyCreditRecordsSupplier = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const statusesMap = getPenaltyCreditStatusEnumsToStringsMap();
  const whereClause = getAllPenaltyCreditRecordsSupplierWhereClause(
    userOrgId,
    type,
  );
  if (!whereClause) {
    return [];
  }
  const pcs = await prisma.penaltyCredit.findMany({
    where: whereClause,
    select: {
      PenaltyCreditHistory: {
        select: { timestamp: true },
        take: 1,
        orderBy: { timestamp: "desc" },
      },
      id: true,
      status: true,
    },
  });
  return pcs.map((pc) => {
    return getSerializedAllRecordsRecordSupplier(
      "Penalty Credits",
      {
        id: pc.id,
        status: statusesMap[pc.status] ?? "",
        mostRecentHistoryEntry: pc.PenaltyCreditHistory[0],
      },
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

// intended for supplier users
export const getAllMyrRecordsSupplier = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const statusesMap = getMyrStatusEnumsToStringsMap();
  const whereClause = getAllMyrRecordsSupplierWhereClause(userOrgId, type);
  if (!whereClause) {
    return [];
  }
  const myrs = await prisma.modelYearReport.findMany({
    where: whereClause,
    select: {
      modelYearReportHistory: {
        where: {
          userAction: {
            notIn: [
              ModelYearReportStatus.RETURNED_TO_ANALYST,
              ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
            ],
          },
        },
        select: { timestamp: true },
        take: 1,
        orderBy: { timestamp: "desc" },
      },
      id: true,
      status: true,
    },
  });
  return myrs.map((myr) =>
    getSerializedAllRecordsRecordSupplier(
      "Model Year Report",
      {
        id: myr.id,
        status: statusesMap[myrMapOfStatusToSupplierStatus[myr.status]] ?? "",
        mostRecentHistoryEntry: myr.modelYearReportHistory[0],
      },
      Routes.ModelYearReports,
    ),
  );
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
      route: getZevModelDetailsRoute(entry.vehicle, true),
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

// intended for supplier users
export const getSupplierRecords = async (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): Promise<SerializedAllRecordsRecordSupplier[]> => {
  const [myrs, cas, zevModels, cts, agreements, pcs] = await Promise.all([
    getAllMyrRecordsSupplier(userOrgId, type),
    getAllCaRecordsSupplier(userOrgId, type),
    getAllZevModelRecordsSupplier(userOrgId, type),
    getAllCreditTransferRecordsSupplier(userOrgId, type),
    getAllCreditAgreementRecordsSupplier(userOrgId, type),
    getAllPenaltyCreditRecordsSupplier(userOrgId, type),
  ]);
  return [...myrs, ...cas, ...zevModels, ...cts, ...agreements, ...pcs];
};
