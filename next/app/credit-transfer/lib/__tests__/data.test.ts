import { getCreditTransfer, getCreditTransferHistories, getCreditTransfers } from "../data";
import { prisma } from "@/lib/prisma";

jest.mock("@/auth", () => ({
  getUserInfo: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    creditTransfer: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    creditTransferHistory: {
      findMany: jest.fn(),
    },
  },
}));

describe("credit-transfer data", () => {
  beforeEach(() => jest.clearAllMocks());

  test("getCreditTransfers applies gov where and returns tuple", async () => {
    const { getUserInfo } = await import("@/auth");
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: true, userOrgId: 2 });
    (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1 }], 1]);
    const result = await getCreditTransfers(1, 10, {}, {});
    expect(result[1]).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  test("getCreditTransfers applies non-gov OR filter", async () => {
    const { getUserInfo } = await import("@/auth");
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: false, userOrgId: 5 });
    (prisma.$transaction as jest.Mock).mockResolvedValueOnce([[{ id: 1 }], 1]);
    await getCreditTransfers(2, 5, {}, {});
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  test("getCreditTransfer fetches with include", async () => {
    const { getUserInfo } = await import("@/auth");
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: true, userOrgId: 2 });
    (prisma.creditTransfer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await getCreditTransfer(1);
    expect(result).toEqual({ id: 1 });
    expect(prisma.creditTransfer.findUnique).toHaveBeenCalled();
  });

  test("getCreditTransferHistories maps for gov and non-gov", async () => {
    const { getUserInfo } = await import("@/auth");
    // Non-gov should filter by supplier statuses
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: false, userOrgId: 2 });
    (prisma.creditTransferHistory.findMany as jest.Mock).mockResolvedValueOnce([
      { userAction: "SUBMITTED_TO_TRANSFER_TO", user: { firstName: "A", lastName: "B", organization: { isGovernment: false } } },
      { userAction: "RECOMMEND_APPROVAL_GOV", user: { firstName: "G", lastName: "C", organization: { isGovernment: true } } },
    ]);
    const nonGov = await getCreditTransferHistories(1);
    expect(nonGov.length).toBe(1);

    // Gov should slice from APPROVED_BY_TRANSFER_TO if present
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: true, userOrgId: 2 });
    (prisma.creditTransferHistory.findMany as jest.Mock).mockResolvedValueOnce([
      { userAction: "FOO", user: {} },
      { userAction: "APPROVED_BY_TRANSFER_TO", user: {} },
      { userAction: "BAR", user: {} },
    ]);
    const gov = await getCreditTransferHistories(1);
    expect(gov.length).toBe(2);
  });
});
