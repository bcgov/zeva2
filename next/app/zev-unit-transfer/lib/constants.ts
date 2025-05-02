import {
  ZevUnitTransferHistoryUserActions,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";

export const visibleToSupplierHistoryStatuses: readonly ZevUnitTransferHistoryUserActions[] =
  [
    ZevUnitTransferHistoryUserActions.SUBMITTED_TO_TRANSFER_TO,
    ZevUnitTransferHistoryUserActions.RESCINDED_BY_TRANSFER_FROM,
    ZevUnitTransferHistoryUserActions.APPROVED_BY_TRANSFER_TO,
    ZevUnitTransferHistoryUserActions.REJECTED_BY_TRANSFER_TO,
    ZevUnitTransferHistoryUserActions.APPROVED_BY_GOV,
    ZevUnitTransferHistoryUserActions.REJECTED_BY_GOV,
  ];

export const transferFromSupplierRescindableStatuses: readonly ZevUnitTransferStatuses[] =
  [
    ZevUnitTransferStatuses.SUBMITTED_TO_TRANSFER_TO,
    ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
    ZevUnitTransferStatuses.RETURNED_TO_ANALYST,
    ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV,
    ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV,
  ];
