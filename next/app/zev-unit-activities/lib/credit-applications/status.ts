import { CreditApplicationStatus } from "@/prisma/generated/enums";

const statusLabels: Readonly<Record<CreditApplicationStatus, string>> = {
  [CreditApplicationStatus.DRAFT]: "Draft",
  [CreditApplicationStatus.SUBMITTED]: "Submitted",
  [CreditApplicationStatus.RETURNED_TO_ANALYST]: "Returned to Analyst",
  [CreditApplicationStatus.RECOMMEND_APPROVAL]: "Recommended",
  [CreditApplicationStatus.APPROVED]: "Issued",
  [CreditApplicationStatus.REJECTED]: "Rejected",
};

// Pass the supplier status for BCeID users, and the internal status for IDIR.
export const getCreditApplicationStatusLabel = (
  status: CreditApplicationStatus,
  userIsGov: boolean,
  validated: boolean,
): string => {
  if (userIsGov && status === CreditApplicationStatus.SUBMITTED && validated) {
    return "Validated";
  }
  return statusLabels[status];
};
