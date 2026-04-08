import { CreditTransferStatus, ZevClass } from "@/prisma/generated/enums";
import Decimal from "decimal.js";

export const transferFromSupplierRescindableStatuses: readonly CreditTransferStatus[] =
  [
    CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
    CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
    CreditTransferStatus.RETURNED_TO_ANALYST,
    CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
    CreditTransferStatus.RECOMMEND_REJECTION_GOV,
  ];

export const mapOfStatusToSupplierStatus: Readonly<
  Record<CreditTransferStatus, CreditTransferStatus>
> = {
  [CreditTransferStatus.APPROVED_BY_GOV]: CreditTransferStatus.APPROVED_BY_GOV,
  [CreditTransferStatus.APPROVED_BY_TRANSFER_TO]:
    CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  [CreditTransferStatus.DRAFT]: CreditTransferStatus.DRAFT,
  [CreditTransferStatus.RECOMMEND_APPROVAL_GOV]:
    CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  [CreditTransferStatus.RECOMMEND_REJECTION_GOV]:
    CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  [CreditTransferStatus.REJECTED_BY_GOV]: CreditTransferStatus.REJECTED_BY_GOV,
  [CreditTransferStatus.REJECTED_BY_TRANSFER_TO]:
    CreditTransferStatus.REJECTED_BY_TRANSFER_TO,
  [CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM]:
    CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
  [CreditTransferStatus.RETURNED_TO_ANALYST]:
    CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  [CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO]:
    CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
};

export type CreditTransferWithRelated = {
  id: number;
  status: CreditTransferStatus;
  transferFrom: {
    name: string;
  };
  transferTo: {
    name: string;
  };
  creditTransferContent: {
    zevClass: ZevClass;
    numberOfUnits: Decimal;
    dollarValuePerUnit: Decimal;
  }[];
  creditTransferHistory: {
    userAction: CreditTransferStatus;
    timestamp: Date;
  }[];
};

export type CreditTransferSerialized = {
  id: number;
  status: CreditTransferStatus;
  transferFrom: string;
  transferTo: string;
  aCredits: string;
  bCredits: string;
  transferValue: string;
  submittedToTransferToDate: string | null;
  approvedByTransferToDate: string | null;
};
