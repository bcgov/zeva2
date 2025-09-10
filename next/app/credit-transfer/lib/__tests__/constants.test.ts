import { transferFromSupplierRescindableStatuses } from "../constants";
import { CreditTransferStatus } from "@/prisma/generated/client";

describe("credit-transfer constants", () => {
  test("rescindable statuses include expected states", () => {
    const s = transferFromSupplierRescindableStatuses;
    expect(s).toEqual(
      expect.arrayContaining([
        CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
        CreditTransferStatus.RETURNED_TO_ANALYST,
        CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
        CreditTransferStatus.RECOMMEND_REJECTION_GOV,
      ]),
    );
  });
});

