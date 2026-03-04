import { ModelYear, ReassessmentStatus } from "@/prisma/generated/enums";

export type LegacyReassessment = {
  id: number;
  modelYear: ModelYear;
  status: ReassessmentStatus;
  sequenceNumber: number;
  organization: {
    name: string;
  };
};
