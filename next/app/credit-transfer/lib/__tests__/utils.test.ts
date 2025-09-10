import { getOrderByClause, getSerializedTransfers, getWhereClause } from "../utils";
import { CreditTransferStatus } from "@/prisma/generated/client";

describe("credit-transfer utils", () => {
  test("getWhereClause builds by id and org names", () => {
    const w = getWhereClause(
      { id: "42", transferFrom: "Acme", transferTo: "Beta", status: "approv" },
      true,
    );
    expect(w).toMatchObject({
      id: 42,
      transferFrom: { is: { name: { contains: "Acme", mode: "insensitive" } } },
    });
    expect(w.transferFrom).toBeDefined();
    expect(w.transferTo).toBeDefined();
    expect(w.status).toBeDefined();
  });

  test("getWhereClause maps supplierStatus for non-gov", () => {
    const w = getWhereClause({ status: "submitted" }, false);
    expect(w.supplierStatus).toBeDefined();
    expect(w.status).toBeUndefined();
  });

  test("getOrderByClause sorts by id, relations, and status per user type", () => {
    expect(getOrderByClause({ id: "desc" }, true, true)).toEqual([{ id: "desc" }]);
    expect(getOrderByClause({ transferTo: "asc" }, false, true)).toEqual([
      { transferTo: { name: "asc" } },
    ]);
    expect(getOrderByClause({ status: "asc" }, false, true)).toEqual([
      { status: "asc" },
    ]);
    expect(getOrderByClause({ status: "asc" }, false, false)).toEqual([
      { supplierStatus: "asc" },
    ]);
    expect(getOrderByClause({}, true, true)).toEqual([{ id: "desc" }]);
  });

  test("getSerializedTransfers hides supplierStatus for gov=false", () => {
    const transfers = [
      {
        id: 1,
        status: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        supplierStatus: CreditTransferStatus.RETURNED_TO_ANALYST,
        transferFrom: { name: "A" },
        transferTo: { name: "B" },
      },
    ];
    const userFalse = getSerializedTransfers(transfers as any, false);
    expect(userFalse[0].status).toBe(CreditTransferStatus.RETURNED_TO_ANALYST);
    // Typescript-wise, supplierStatus removed
    expect((userFalse[0] as any).supplierStatus).toBeUndefined();

    const userTrue = getSerializedTransfers(transfers as any, true);
    expect(userTrue[0].status).toBe(CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO);
  });
});
