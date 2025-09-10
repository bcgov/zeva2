import {
  applyTransfersAway,
  flattenZevUnitRecords,
  getSummedZevUnitRecordsObj,
  getZevUnitRecords,
  sumBalance,
  UnexpectedDebit,
  UncoveredTransfer,
} from "../zevUnit";
import {
  ModelYear,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";

const d = (n: number) => new Decimal(n as any) as any;

describe("zevUnit helpers", () => {
  const vc = VehicleClass.REPORTABLE as any;
  const zc = ZevClass.A as any;
  const my = ModelYear.MY_2024 as any;

  test("getZevUnitRecords maps finalNumberOfUnits to numberOfUnits", () => {
    const balances: any[] = [
      {
        type: TransactionType.CREDIT,
        vehicleClass: vc,
        zevClass: zc,
        modelYear: my,
        finalNumberOfUnits: d(5),
      },
    ];
    const result = getZevUnitRecords(balances);
    expect(result).toHaveLength(1);
    expect(result[0].numberOfUnits.equals(d(5))).toBe(true);
  });

  test("getSummedZevUnitRecordsObj groups and sums by keys", () => {
    const records: any[] = [
      {
        type: TransactionType.CREDIT,
        vehicleClass: vc,
        zevClass: zc,
        modelYear: my,
        numberOfUnits: d(3),
      },
      {
        type: TransactionType.CREDIT,
        vehicleClass: vc,
        zevClass: zc,
        modelYear: my,
        numberOfUnits: d(4),
      },
    ];
    const obj = getSummedZevUnitRecordsObj(records);
    expect(obj[TransactionType.CREDIT]![vc]![zc]![my]!.equals(d(7))).toBe(true);
  });

  test("sumBalance sums across model years for slice", () => {
    const records: any[] = [
      { type: TransactionType.CREDIT, vehicleClass: vc, zevClass: zc, modelYear: ModelYear.MY_2023, numberOfUnits: d(1) },
      { type: TransactionType.CREDIT, vehicleClass: vc, zevClass: zc, modelYear: ModelYear.MY_2024, numberOfUnits: d(2) },
    ];
    const obj = getSummedZevUnitRecordsObj(records);
    const total = sumBalance(obj, TransactionType.CREDIT as any, vc, zc);
    expect(total.equals(d(3))).toBe(true);
  });

  test("applyTransfersAway offsets matching transfers", () => {
    const records: any[] = [
      { type: TransactionType.CREDIT, vehicleClass: vc, zevClass: zc, modelYear: my, numberOfUnits: d(5) },
      { type: TransactionType.TRANSFER_AWAY, vehicleClass: vc, zevClass: zc, modelYear: my, numberOfUnits: d(3) },
    ];
    const result = applyTransfersAway(records);
    // Expect remaining credit of 2 and no transfer-away records
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(TransactionType.CREDIT);
    expect(result[0].numberOfUnits.equals(d(2))).toBe(true);
  });

  test("applyTransfersAway throws on uncovered transfer", () => {
    const records: any[] = [
      { type: TransactionType.TRANSFER_AWAY, vehicleClass: vc, zevClass: zc, modelYear: my, numberOfUnits: d(1) },
    ];
    expect(() => applyTransfersAway(records)).toThrow(UncoveredTransfer);
  });

  test("flattenZevUnitRecords drops zero-unit records", () => {
    const records: any[] = [
      { type: TransactionType.CREDIT, vehicleClass: vc, zevClass: zc, modelYear: my, numberOfUnits: d(0) },
      { type: TransactionType.CREDIT, vehicleClass: vc, zevClass: zc, modelYear: my, numberOfUnits: d(2) },
    ];
    const flat = flattenZevUnitRecords(records);
    expect(flat).toHaveLength(1);
    expect(flat[0].numberOfUnits.equals(d(2))).toBe(true);
  });
});

