import { ModelYear, ReassessmentStatus } from "@/prisma/generated/enums";

export type LegacyReassessment = {
  id: number;
  modelYear: ModelYear;
  status: ReassessmentStatus;
  organization: {
    name: string;
  };
  ReassessmentHistory: {
    userAction: ReassessmentStatus;
    timestamp: Date;
  }[];
};

export type LegacyReassessmentSerialized = {
  id: number;
  modelYear: ModelYear;
  status: ReassessmentStatus;
  supplier: string;
  submittedDate: string | null;
  issuedDate: string | null;
};
