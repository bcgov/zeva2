import { Role } from "@/prisma/generated/enums";

export type Item = {
  id: number;
  timestamp?: string;
  status: string;
  route: string;
  cta: string;
};

export const itemsToTake = 5;

export type AllRecordsRecord = {
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

export type SerializedAllRecordsRecord = {
  id: number;
  type: string;
  supplier: string;
  status: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  date: string;
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
