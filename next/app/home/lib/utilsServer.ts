import {
  getIsoYmdString,
  getTimeWithTz,
  validateDate,
} from "@/app/lib/utils/date";
import {
  ActivityFeedRecord,
  AllRecordsRecordGov,
  AllRecordsRecordSupplier,
  AllRecordTypeGov,
  AllRecordTypeSupplier,
  RecordType,
  SerializedActivityFeedRecord,
  SerializedAllRecordsRecordGov,
  SerializedAllRecordsRecordSupplier,
} from "./constants";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import Decimal from "decimal.js";
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
  AgreementHistoryWhereInput,
  AgreementWhereInput,
  CreditApplicationHistoryWhereInput,
  CreditApplicationWhereInput,
  CreditTransferHistoryWhereInput,
  CreditTransferWhereInput,
  ModelYearReportHistoryWhereInput,
  ModelYearReportWhereInput,
  PenaltyCreditHistoryWhereInput,
  PenaltyCreditWhereInput,
  VehicleHistoryWhereInput,
  VehicleWhereInput,
} from "@/prisma/generated/models";

export const getNDaysAgo = (n: number) => {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
};

export const getSerializedActivityFeedRecord = (
  record: ActivityFeedRecord,
): SerializedActivityFeedRecord => {
  const rolesMap = getRoleEnumsToStringsMap();
  const user = record.user;
  return {
    id: record.recordId,
    activityType: record.activityType,
    recordType: record.recordType,
    supplier: record.supplier,
    performedBy: `${user.firstName} ${user.lastName} - ${user.roles.map((role) => rolesMap[role]).join(", ")}`,
    date: getIsoYmdString(record.timestamp),
    dateTime: `${getIsoYmdString(record.timestamp)} ${getTimeWithTz(record.timestamp)}`,
    sortKey: record.timestamp.toISOString(),
    baseRoute: record.route,
  };
};

export const getSerializedAllRecordsRecordGov = (
  type: RecordType,
  record: AllRecordsRecordGov,
  baseRoute: string,
): SerializedAllRecordsRecordGov => {
  const now = new Date();
  const ts = record.mostRecentHistoryEntry.timestamp;
  const user = record.mostRecentHistoryEntry.user;
  const rolesMap = getRoleEnumsToStringsMap();
  const id = record.id;
  return {
    id,
    type,
    supplier: record.organization.name,
    status: record.status,
    lastUpdated: `${new Decimal(now.getTime() - ts.getTime()).div(1000 * 60 * 60 * 24).toFixed(0)} days ago`,
    lastUpdatedBy: `${user.firstName} ${user.lastName} - ${user.roles.map((role) => rolesMap[role]).join(", ")}`,
    date: getIsoYmdString(ts),
    baseRoute,
  };
};

export const getSerializedAllRecordsRecordSupplier = (
  type: RecordType,
  record: AllRecordsRecordSupplier,
  baseRoute: string,
): SerializedAllRecordsRecordSupplier => {
  const now = new Date();
  const ts = record.mostRecentHistoryEntry.timestamp;
  const id = record.id;
  return {
    id,
    type,
    status: record.status,
    lastUpdated: `${new Decimal(now.getTime() - ts.getTime()).div(1000 * 60 * 60 * 24).toFixed(0)} days ago`,
    date: getIsoYmdString(ts),
    baseRoute,
  };
};

export const getDateRangeOptions = (
  records: { date: string }[],
  intervals: number,
): [string, string][] => {
  const dates = new Set<string>();
  for (const record of records) {
    dates.add(record.date);
  }
  const sortedDates = [...dates].sort();
  if (sortedDates.length < 2) {
    return [];
  }
  const leastDateString = sortedDates[0];
  const greatestDateString = sortedDates[1];
  const intervalsDec = new Decimal(intervals);
  if (!intervalsDec.isInteger() || intervalsDec.lte(0)) {
    return [];
  }
  const [leastDateValid, leastDate] = validateDate(leastDateString);
  const [greatestDateValid, greatestDate] = validateDate(greatestDateString);
  if (!leastDateValid || !greatestDateValid) {
    return [];
  }
  const result: [string, string][] = [];
  const diff = greatestDate.getTime() - leastDate.getTime();
  const intervalLength = new Decimal(diff)
    .dividedToIntegerBy(intervals)
    .toNumber();
  let intervalStart = leastDate.getTime();
  for (let i = 1; i <= intervals; i++) {
    const intervalEnd = intervalStart + intervalLength;
    result.push([
      getIsoYmdString(new Date(intervalStart)),
      getIsoYmdString(new Date(intervalEnd)),
    ]);
    intervalStart = intervalEnd;
  }
  return result;
};

export const getAllCaRecordsGovWhereClause = (
  userRoles: Role[],
  type: AllRecordTypeGov,
): CreditApplicationWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const analystRequiresActionWhereClause: CreditApplicationWhereInput = {
    status: {
      in: [
        CreditApplicationStatus.RETURNED_TO_ANALYST,
        CreditApplicationStatus.SUBMITTED,
      ],
    },
  };
  const directorRequiresActionWhereClause: CreditApplicationWhereInput = {
    status: CreditApplicationStatus.RECOMMEND_APPROVAL,
  };
  const analystWithDirectorWhereClause: CreditApplicationWhereInput = {
    status: CreditApplicationStatus.RECOMMEND_APPROVAL,
  };
  const completedWhereClause: CreditApplicationWhereInput = {
    CreditApplicationHistory: {
      some: {
        timestamp: { gte: nDaysAgo },
      },
    },
    status: {
      in: [CreditApplicationStatus.APPROVED, CreditApplicationStatus.REJECTED],
    },
  };
  let whereClause: CreditApplicationWhereInput | null = null;
  if (type === "all") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = {
        OR: [directorRequiresActionWhereClause, completedWhereClause],
      };
    } else {
      whereClause = {
        OR: [
          analystRequiresActionWhereClause,
          analystWithDirectorWhereClause,
          completedWhereClause,
        ],
      };
    }
  } else if (type === "requires-your-action") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = directorRequiresActionWhereClause;
    } else {
      whereClause = analystRequiresActionWhereClause;
    }
  } else if (
    type === "with-director" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystWithDirectorWhereClause;
  } else if (type === "completed") {
    whereClause = completedWhereClause;
  }
  return whereClause;
};

export const getAllCaRecordsSupplierWhereClause = (
  userOrgId: number,
  type: AllRecordTypeSupplier,
): CreditApplicationWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const requiresActionWhereClause: CreditApplicationWhereInput = {
    status: CreditApplicationStatus.DRAFT,
  };
  const inProgressWhereClause: CreditApplicationWhereInput = {
    status: {
      in: [
        CreditApplicationStatus.RECOMMEND_APPROVAL,
        CreditApplicationStatus.RETURNED_TO_ANALYST,
        CreditApplicationStatus.SUBMITTED,
      ],
    },
  };
  const forAwarenessWhereClause: CreditApplicationWhereInput = {
    status: {
      in: [CreditApplicationStatus.APPROVED, CreditApplicationStatus.REJECTED],
    },
    CreditApplicationHistory: { some: { timestamp: { gte: nDaysAgo } } },
  };
  let whereClause: CreditApplicationWhereInput | null = null;
  if (type === "all") {
    whereClause = {
      OR: [
        requiresActionWhereClause,
        inProgressWhereClause,
        forAwarenessWhereClause,
      ],
    };
  } else if (type === "requires-your-action") {
    whereClause = requiresActionWhereClause;
  } else if (type === "in-progress") {
    whereClause = inProgressWhereClause;
  } else if (type === "for-awareness") {
    whereClause = forAwarenessWhereClause;
  }
  if (whereClause) {
    return {
      ...whereClause,
      organizationId: userOrgId,
    };
  }
  return null;
};

export const getAllZevModelRecordsGovWhereClause = (
  userRoles: Role[],
  type: AllRecordTypeGov,
): VehicleWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const analystRequiresActionWhereClause: VehicleWhereInput = {
    status: VehicleStatus.SUBMITTED,
  };
  const completedWhereClause: VehicleWhereInput = {
    status: VehicleStatus.VALIDATED,
    VehicleHistory: {
      some: {
        timestamp: {
          gte: nDaysAgo,
        },
      },
    },
  };
  let whereClause: VehicleWhereInput | null = null;
  if (type === "all") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = completedWhereClause;
    } else {
      whereClause = {
        OR: [analystRequiresActionWhereClause, completedWhereClause],
      };
    }
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystRequiresActionWhereClause;
  } else if (type === "completed") {
    whereClause = completedWhereClause;
  }
  return whereClause;
};

export const getAllCreditTransferRecordsGovWhereClause = (
  userRoles: Role[],
  type: AllRecordTypeGov,
): CreditTransferWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const analystRequiresActionWhereClause: CreditTransferWhereInput = {
    status: {
      in: [
        CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
        CreditTransferStatus.RETURNED_TO_ANALYST,
      ],
    },
  };
  const analystWithDirectorWhereClause: CreditTransferWhereInput = {
    status: {
      in: [
        CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
        CreditTransferStatus.RECOMMEND_REJECTION_GOV,
      ],
    },
  };
  const directorRequiresActionWhereClause: CreditTransferWhereInput = {
    status: {
      in: [
        CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
        CreditTransferStatus.RECOMMEND_REJECTION_GOV,
      ],
    },
  };
  const analystCompletedWhereClause: CreditTransferWhereInput = {
    AND: [
      {
        creditTransferHistory: {
          some: {
            timestamp: { gte: nDaysAgo },
          },
        },
      },
      {
        creditTransferHistory: {
          some: {
            userAction: CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
          },
        },
      },
    ],
    status: {
      in: [
        CreditTransferStatus.APPROVED_BY_GOV,
        CreditTransferStatus.REJECTED_BY_GOV,
        CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
      ],
    },
  };
  const directorCompletedWhereClause: CreditTransferWhereInput = {
    creditTransferHistory: {
      some: {
        timestamp: { gte: nDaysAgo },
      },
    },
    OR: [
      {
        creditTransferHistory: {
          some: {
            userAction: CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
          },
        },
      },
      {
        creditTransferHistory: {
          some: {
            userAction: CreditTransferStatus.RECOMMEND_REJECTION_GOV,
          },
        },
      },
    ],
    status: {
      in: [
        CreditTransferStatus.APPROVED_BY_GOV,
        CreditTransferStatus.REJECTED_BY_GOV,
        CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
      ],
    },
  };
  let whereClause: CreditTransferWhereInput | null = null;
  if (type === "all") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = {
        OR: [directorRequiresActionWhereClause, directorCompletedWhereClause],
      };
    } else {
      whereClause = {
        OR: [
          analystRequiresActionWhereClause,
          analystWithDirectorWhereClause,
          analystCompletedWhereClause,
        ],
      };
    }
  } else if (type === "requires-your-action") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = directorRequiresActionWhereClause;
    } else {
      whereClause = analystRequiresActionWhereClause;
    }
  } else if (
    type === "with-director" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystWithDirectorWhereClause;
  } else if (type === "completed") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = directorCompletedWhereClause;
    } else {
      whereClause = analystCompletedWhereClause;
    }
  }
  return whereClause;
};

export const getAllCreditAgreementRecordsGovWhereClause = (
  userRoles: Role[],
  type: AllRecordTypeGov,
): AgreementWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const analystRequiresActionWhereClause: AgreementWhereInput = {
    status: AgreementStatus.RETURNED_TO_ANALYST,
  };
  const analystInProgressWhereClause: AgreementWhereInput = {
    status: AgreementStatus.DRAFT,
  };
  const analystWithDirectorWhereClause: AgreementWhereInput = {
    status: AgreementStatus.RECOMMEND_APPROVAL,
  };
  const directorRequiresActionWhereClause: AgreementWhereInput = {
    status: AgreementStatus.RECOMMEND_APPROVAL,
  };
  const completedWhereClause: AgreementWhereInput = {
    agreementHistory: {
      some: {
        timestamp: {
          gte: nDaysAgo,
        },
      },
    },
    status: AgreementStatus.ISSUED,
  };
  let whereClause: AgreementWhereInput | null = null;
  if (type === "all") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = {
        OR: [directorRequiresActionWhereClause, completedWhereClause],
      };
    } else {
      whereClause = {
        OR: [
          analystInProgressWhereClause,
          analystRequiresActionWhereClause,
          analystWithDirectorWhereClause,
        ],
      };
    }
  } else if (
    type === "in-progress" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystInProgressWhereClause;
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystRequiresActionWhereClause;
  } else if (
    type === "with-director" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystWithDirectorWhereClause;
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.DIRECTOR)
  ) {
    whereClause = directorRequiresActionWhereClause;
  } else if (type === "completed") {
    whereClause = completedWhereClause;
  }
  return whereClause;
};

export const getAllPenaltyCreditRecordsGovWhereClause = (
  userRoles: Role[],
  type: AllRecordTypeGov,
): PenaltyCreditWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const analystRequiresActionWhereClause: PenaltyCreditWhereInput = {
    status: PenaltyCreditStatus.RETURNED_TO_ANALYST,
  };
  const analystInProgressWhereClause: PenaltyCreditWhereInput = {
    status: PenaltyCreditStatus.DRAFT,
  };
  const analystWithDirectorWhereClause: PenaltyCreditWhereInput = {
    status: PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
  };
  const directorRequiresActionWhereClause: PenaltyCreditWhereInput = {
    status: PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
  };
  const completedWhereClause: PenaltyCreditWhereInput = {
    PenaltyCreditHistory: {
      some: {
        timestamp: {
          gte: nDaysAgo,
        },
      },
    },
    status: PenaltyCreditStatus.APPROVED,
  };
  let whereClause: PenaltyCreditWhereInput | null = null;
  if (type === "all") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = {
        OR: [directorRequiresActionWhereClause, completedWhereClause],
      };
    } else {
      whereClause = {
        OR: [
          analystInProgressWhereClause,
          analystRequiresActionWhereClause,
          analystWithDirectorWhereClause,
        ],
      };
    }
  } else if (
    type === "in-progress" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystInProgressWhereClause;
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystRequiresActionWhereClause;
  } else if (
    type === "with-director" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystWithDirectorWhereClause;
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.DIRECTOR)
  ) {
    whereClause = directorRequiresActionWhereClause;
  } else if (type === "completed") {
    whereClause = completedWhereClause;
  }
  return whereClause;
};

export const getAllMyrRecordsGovWhereClause = (
  userRoles: Role[],
  type: AllRecordTypeGov,
): ModelYearReportWhereInput | null => {
  const nDaysAgo = getNDaysAgo(30);
  const analystRequiresActionWhereClause: ModelYearReportWhereInput = {
    status: {
      in: [
        ModelYearReportStatus.RETURNED_TO_ANALYST,
        ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      ],
    },
  };
  const analystWithDirectorWhereClause: ModelYearReportWhereInput = {
    status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
  };
  const directorRequiresActionWhereClause: ModelYearReportWhereInput = {
    status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
  };
  const completedWhereClause: ModelYearReportWhereInput = {
    status: ModelYearReportStatus.ASSESSED,
    modelYearReportHistory: { some: { timestamp: { gte: nDaysAgo } } },
  };
  let whereClause: ModelYearReportWhereInput | null = null;
  if (type === "all") {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause = {
        OR: [directorRequiresActionWhereClause, completedWhereClause],
      };
    } else {
      whereClause = {
        OR: [
          analystRequiresActionWhereClause,
          analystWithDirectorWhereClause,
          completedWhereClause,
        ],
      };
    }
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystRequiresActionWhereClause;
  } else if (
    type === "with-director" &&
    userRoles.includes(Role.ZEVA_IDIR_USER)
  ) {
    whereClause = analystWithDirectorWhereClause;
  } else if (
    type === "requires-your-action" &&
    userRoles.includes(Role.DIRECTOR)
  ) {
    whereClause = directorRequiresActionWhereClause;
  } else if (type === "completed") {
    whereClause = completedWhereClause;
  }
  return whereClause;
};

export const getActivityFeedCaRecordsWhereClause = (
  userRoles: Role[],
): CreditApplicationHistoryWhereInput => {
  const nDaysAgo = getNDaysAgo(30);
  let whereClause: CreditApplicationHistoryWhereInput = {
    timestamp: { gte: nDaysAgo },
  };
  if (userRoles.includes(Role.DIRECTOR)) {
    whereClause.userAction = {
      in: [
        CreditApplicationStatus.APPROVED,
        CreditApplicationStatus.RECOMMEND_APPROVAL,
        CreditApplicationStatus.REJECTED,
      ],
    };
    whereClause.creditApplication = {
      status: {
        in: [
          CreditApplicationStatus.APPROVED,
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.REJECTED,
        ],
      },
    };
  } else {
    whereClause.userAction = {
      not: CreditApplicationStatus.DRAFT,
    };
    whereClause.creditApplication = {
      status: {
        not: CreditApplicationStatus.DRAFT,
      },
    };
  }
  return whereClause;
};

export const getActivityFeedZevModelRecordsWhereClause = (
  userRoles: Role[],
): VehicleHistoryWhereInput => {
  const nDaysAgo = getNDaysAgo(30);
  let whereClause: VehicleHistoryWhereInput = {
    timestamp: { gte: nDaysAgo },
  };
  if (userRoles.includes(Role.DIRECTOR)) {
    whereClause.userAction = VehicleStatus.VALIDATED;
    whereClause.vehicle = {
      status: VehicleStatus.VALIDATED,
    };
  } else {
    whereClause.userAction = {
      notIn: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
    };
    whereClause.vehicle = {
      status: {
        notIn: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
      },
    };
  }
  return whereClause;
};

export const getActivityFeedCreditTransferRecordsWhereClause = (
  userRoles: Role[],
): CreditTransferHistoryWhereInput => {
  const nDaysAgo = getNDaysAgo(30);
  let whereClause: CreditTransferHistoryWhereInput = {
    timestamp: { gte: nDaysAgo },
  };
  if (userRoles.includes(Role.DIRECTOR)) {
    whereClause.userAction = {
      in: [
        CreditTransferStatus.APPROVED_BY_GOV,
        CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
        CreditTransferStatus.RECOMMEND_REJECTION_GOV,
        CreditTransferStatus.REJECTED_BY_GOV,
      ],
    };
    whereClause.creditTransfer = {
      status: {
        in: [
          CreditTransferStatus.APPROVED_BY_GOV,
          CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
          CreditTransferStatus.RECOMMEND_REJECTION_GOV,
          CreditTransferStatus.REJECTED_BY_GOV,
        ],
      },
    };
  } else {
    whereClause.userAction = {
      notIn: [
        CreditTransferStatus.DRAFT,
        CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
        CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
      ],
    };
    whereClause.creditTransfer = {
      status: {
        notIn: [
          CreditTransferStatus.DRAFT,
          CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
          CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
          CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
        ],
      },
    };
  }
  return whereClause;
};

export const getActivityFeedCreditAgreementRecordsWhereClause = (
  userRoles: Role[],
): AgreementHistoryWhereInput => {
  const nDaysAgo = getNDaysAgo(30);
  let whereClause: AgreementHistoryWhereInput = {
    timestamp: { gte: nDaysAgo },
  };
  if (userRoles.includes(Role.DIRECTOR)) {
    whereClause.userAction = {
      notIn: [AgreementStatus.DRAFT, AgreementStatus.RETURNED_TO_ANALYST],
    };
    whereClause.agreement = {
      status: {
        notIn: [AgreementStatus.DRAFT, AgreementStatus.RETURNED_TO_ANALYST],
      },
    };
  }
  return whereClause;
};

export const getActivityFeedPenaltyCreditRecordsWhereClause = (
  userRoles: Role[],
): PenaltyCreditHistoryWhereInput => {
  const nDaysAgo = getNDaysAgo(30);
  let whereClause: PenaltyCreditHistoryWhereInput = {
    timestamp: { gte: nDaysAgo },
  };
  if (userRoles.includes(Role.DIRECTOR)) {
    whereClause.userAction = {
      notIn: [
        PenaltyCreditStatus.DRAFT,
        PenaltyCreditStatus.RETURNED_TO_ANALYST,
      ],
    };
    whereClause.penaltyCredit = {
      status: {
        notIn: [
          PenaltyCreditStatus.DRAFT,
          PenaltyCreditStatus.RETURNED_TO_ANALYST,
        ],
      },
    };
  }
  return whereClause;
};

export const getActivityFeedMyrRecordsWhereClause = (
  userRoles: Role[],
): ModelYearReportHistoryWhereInput => {
  const nDaysAgo = getNDaysAgo(30);
  let whereClause: ModelYearReportHistoryWhereInput = {
    timestamp: { gte: nDaysAgo },
  };
  if (userRoles.includes(Role.DIRECTOR)) {
    whereClause.userAction = {
      in: [
        ModelYearReportStatus.ASSESSED,
        ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      ],
    };
    whereClause.modelYearReport = {
      status: {
        in: [
          ModelYearReportStatus.ASSESSED,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ],
      },
    };
  } else {
    whereClause.userAction = {
      notIn: [
        ModelYearReportStatus.DRAFT,
        ModelYearReportStatus.RETURNED_TO_SUPPLIER,
      ],
    };
    whereClause.modelYearReport = {
      status: {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    };
  }
  return whereClause;
};
