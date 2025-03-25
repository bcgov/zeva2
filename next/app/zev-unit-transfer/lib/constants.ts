import { ZevUnitTransferHistoryStatuses } from "@/prisma/generated/client";

export const visibleToSupplierHistoryStatuses = [
  ZevUnitTransferHistoryStatuses.SUBMITTED_TO_TRANSFER_TO,
  ZevUnitTransferHistoryStatuses.RESCINDED_BY_TRANSFER_FROM,
  ZevUnitTransferHistoryStatuses.APPROVED_BY_TRANSFER_TO,
  ZevUnitTransferHistoryStatuses.REJECTED_BY_TRANSFER_TO,
  ZevUnitTransferHistoryStatuses.APPROVED_BY_GOV,
  ZevUnitTransferHistoryStatuses.REJECTED_BY_GOV,
];
