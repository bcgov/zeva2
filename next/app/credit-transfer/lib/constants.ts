import { CreditTransferStatus } from "@/prisma/generated/enums";

export const transferFromSupplierRescindableStatuses: readonly CreditTransferStatus[] =
  [
    CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
    CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
    CreditTransferStatus.RETURNED_TO_ANALYST,
    CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
    CreditTransferStatus.RECOMMEND_REJECTION_GOV,
  ];
