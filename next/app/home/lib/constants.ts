import { Role } from "@/prisma/generated/enums";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCar,
  faFile,
  faFileContract,
  faList,
  faMoneyBillTransfer,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export type Item = {
  id: number;
  timestamp?: string;
  status: string;
  route: string;
  cta: string;
};

export const itemsToTake = 5;

export type AllRecordsRecordGov = {
  id: number;
  status: string;
  organization: {
    name: string;
  };
  mostRecentHistoryEntry: {
    timestamp: Date;
    user: {
      roles: Role[];
      firstName: string;
      lastName: string;
    };
  };
};

export type AllRecordsRecordSupplier = {
  id: number;
  status: string;
  mostRecentHistoryEntry?: {
    timestamp: Date;
  };
};

export type SerializedAllRecordsRecordGov = {
  id: number;
  type: RecordType;
  supplier: string;
  status: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  date: string;
  baseRoute: string;
};

export type SerializedAllRecordsRecordSupplier = {
  id: number;
  type: RecordType;
  status: string;
  lastUpdated: string;
  date: string;
  baseRoute: string;
};

export type ActivityFeedRecord = {
  recordId: number;
  recordType: RecordType;
  activityType: string;
  supplier: string;
  route: string;
  timestamp: Date;
  user: {
    roles: Role[];
    firstName: string;
    lastName: string;
  };
};

export type SerializedActivityFeedRecord = {
  id: number;
  activityType: string;
  recordType: RecordType;
  supplier: string;
  performedBy: string;
  date: string;
  dateTime: string;
  sortKey: string;
  baseRoute: string;
};

export const recordTypes = [
  "Credit Application",
  "ZEV Model",
  "Credit Transfer",
  "Credit Agreement",
  "Penalty Credits",
  "Model Year Report",
] as const;

export type RecordType = (typeof recordTypes)[number];

export const dateOptionSplitter = " to ";

export const allRecordsViewParam = "view";

export const allRecordsTypesGov = [
  "all",
  "requires-your-action",
  "in-progress",
  "with-director",
  "completed",
] as const;

export type AllRecordTypeGov = (typeof allRecordsTypesGov)[number];

export const allRecordsTypesSupplier = [
  "all",
  "requires-your-action",
  "in-progress",
  "for-awareness",
] as const;

export type AllRecordTypeSupplier = (typeof allRecordsTypesSupplier)[number];

export const supplierViewsData: Record<
  AllRecordTypeSupplier,
  { title: string; description: string }
> = {
  all: {
    title: "All Records",
    description: "Browse and search all of your organization's records.",
  },
  "requires-your-action": {
    title: "Requires Your Action",
    description: "Records awaiting action from you.",
  },
  "in-progress": {
    title: "In Progress",
    description: "Records currently in progress.",
  },
  "for-awareness": {
    title: "For Awareness",
    description: "Records that have been completed or updated.",
  },
} as const;

export const govDashboardSections = [
  "Requires Your Action",
  "In Progress",
  "With Director",
  "Completed",
] as const;

export type GovDashboardSection = (typeof govDashboardSections)[number];

export type GovDashboardCounts = Record<RecordType, number>;

export type DashboardTone = "error" | "warning" | "info" | "success";

export const dashboardToneClasses: Record<
  DashboardTone,
  { border: string; bg: string; text: string }
> = {
  error: { border: "border-error", bg: "bg-errorBG", text: "text-error" },
  warning: {
    border: "border-warningBorder",
    bg: "bg-warningBG",
    text: "text-warning",
  },
  info: {
    border: "border-linkIcon",
    bg: "bg-infoBG",
    text: "text-primaryBlue",
  },
  success: {
    border: "border-success",
    bg: "bg-successBG",
    text: "text-success",
  },
} as const;

export const govViewsData: Record<
  AllRecordTypeGov,
  { title: string; description: string }
> = {
  all: {
    title: "All Records",
    description:
      "Browse and search all records available to your organization.",
  },
  "requires-your-action": {
    title: "Requires Your Action",
    description: "Records awaiting action from you.",
  },
  "in-progress": {
    title: "In Progress",
    description: "Records currently in progress.",
  },
  "with-director": {
    title: "With Director",
    description: "Records currently with a Director.",
  },
  completed: {
    title: "Completed",
    description: "Records that have been completed.",
  },
} as const;

export const recordTypeStyles: Record<
  RecordType,
  { icon: IconDefinition; tone: DashboardTone }
> = {
  "Credit Application": { icon: faList, tone: "success" },
  "ZEV Model": { icon: faCar, tone: "warning" },
  "Credit Transfer": { icon: faMoneyBillTransfer, tone: "success" },
  "Credit Agreement": { icon: faFileContract, tone: "success" },
  "Penalty Credits": { icon: faTriangleExclamation, tone: "error" },
  "Model Year Report": { icon: faFile, tone: "success" },
} as const;
