import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/enums";

export type LegacySupplementary = {
  id: number;
  modelYear: ModelYear;
  status: ModelYearReportStatus;
  organization: {
    name: string;
  };
  SupplementaryReportHistory: {
    userAction: ModelYearReportStatus;
    timestamp: Date;
  }[];
};

export type LegacySupplementarySerialized = {
  id: number;
  modelYear: ModelYear;
  status: ModelYearReportStatus;
  supplier: string;
  submittedDate: string | null;
  assessedDate: string | null;
};
