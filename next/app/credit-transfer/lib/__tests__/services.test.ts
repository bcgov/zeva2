import {
  createTransferHistory,
  updateTransferStatus,
  updateTransferStatusAndCreateHistory,
  transferIsCovered,
} from "../services";
import { prisma } from "@/lib/prisma";
import { CreditTransferStatus, TransactionType } from "@/prisma/generated/client";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    creditTransferHistory: { create: jest.fn() },
    creditTransfer: { update: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    zevUnitEndingBalance: { findFirst: jest.fn(), findMany: jest.fn() },
    zevUnitTransaction: { findMany: jest.fn() },
  },
}));

jest.mock("@/app/lib/utils/complianceYear", () => ({
  getComplianceInterval: jest.fn(() => ({ closedLowerBound: new Date(0), openUpperBound: new Date(1) })),
}));

jest.mock("@/lib/utils/zevUnit", () => {
  return {
    applyTransfersAway: jest.fn(),
    getZevUnitRecords: jest.fn((balances: any) => balances.map((b: any) => ({ ...b, numberOfUnits: b.finalNumberOfUnits }))),
    UncoveredTransfer: class UncoveredTransfer extends Error {},
  };
});

describe("credit-transfer services", () => {
  beforeEach(() => jest.clearAllMocks());

  test("createTransferHistory uses prisma client passed", async () => {
    const tx = { creditTransferHistory: { create: jest.fn() } };
    await createTransferHistory({ creditTransferId: 1, userId: 2, userAction: CreditTransferStatus.RETURNED_TO_ANALYST }, tx as any);
    expect(tx.creditTransferHistory.create).toHaveBeenCalled();
  });

  test("updateTransferStatus updates record", async () => {
    await updateTransferStatus(7, CreditTransferStatus.APPROVED_BY_GOV, CreditTransferStatus.APPROVED_BY_GOV);
    expect(prisma.creditTransfer.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 } }));
  });

  test("updateTransferStatusAndCreateHistory chains both", async () => {
    const tx = {
      creditTransfer: { update: jest.fn() },
      creditTransferHistory: { create: jest.fn() },
    };
    await updateTransferStatusAndCreateHistory(9, 3, CreditTransferStatus.RETURNED_TO_ANALYST, CreditTransferStatus.APPROVED_BY_TRANSFER_TO, "c", tx as any);
    expect(tx.creditTransfer.update).toHaveBeenCalled();
    expect(tx.creditTransferHistory.create).toHaveBeenCalled();
  });

  test("transferIsCovered returns true when applyTransfersAway does not throw", async () => {
    // No ending balance
    (prisma.zevUnitEndingBalance.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.zevUnitTransaction.findMany as jest.Mock).mockResolvedValue([]);
    const result = await transferIsCovered({
      transferFromId: 1,
      creditTransferContent: [
        { numberOfUnits: 1, vehicleClass: "REPORTABLE", zevClass: "A", modelYear: "MY_2024" },
      ],
    } as any);
    expect(result).toBe(true);
  });

  test("transferIsCovered returns false on UncoveredTransfer", async () => {
    const { applyTransfersAway, UncoveredTransfer } = await import("@/lib/utils/zevUnit");
    (prisma.zevUnitEndingBalance.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.zevUnitTransaction.findMany as jest.Mock).mockResolvedValue([]);
    (applyTransfersAway as jest.Mock).mockImplementation(() => {
      throw new (UncoveredTransfer as any)();
    });
    const result = await transferIsCovered({
      transferFromId: 1,
      creditTransferContent: [
        { numberOfUnits: 1, vehicleClass: "REPORTABLE", zevClass: "A", modelYear: "MY_2024" },
      ],
    } as any);
    expect(result).toBe(false);
  });
});

