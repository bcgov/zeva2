import {
  ZevUnitTransferHistoryStatuses,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";

export const visibleToSupplierHistoryStatuses: readonly ZevUnitTransferHistoryStatuses[] =
  [
    ZevUnitTransferHistoryStatuses.SUBMITTED_TO_TRANSFER_TO,
    ZevUnitTransferHistoryStatuses.RESCINDED_BY_TRANSFER_FROM,
    ZevUnitTransferHistoryStatuses.APPROVED_BY_TRANSFER_TO,
    ZevUnitTransferHistoryStatuses.REJECTED_BY_TRANSFER_TO,
    ZevUnitTransferHistoryStatuses.APPROVED_BY_GOV,
    ZevUnitTransferHistoryStatuses.REJECTED_BY_GOV,
  ];

export const govCommentableStatuses: readonly ZevUnitTransferStatuses[] = [
  ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
  ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV,
  ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV,
  ZevUnitTransferStatuses.APPROVED_BY_GOV,
  ZevUnitTransferStatuses.REJECTED_BY_GOV,
];
