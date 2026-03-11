import { ModelYear, SupplementaryReportStatus } from "@/prisma/generated/enums";

export type LegacySupplementary = {
  id: number;
  modelYear: ModelYear;
  status: SupplementaryReportStatus;
  sequenceNumber: number;
  organization?: {
    name: string;
  };
};
