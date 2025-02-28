import {
  VehicleClass,
  ZevClass,
  ModelYear,
  TransactionType,
  ZevUnitTransaction,
  ZevUnitEndingBalance,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";

interface ZevUnitRecordBase {
  numberOfUnits: Decimal;
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  modelYear: ModelYear;
  type: TransactionType;
}

type ZevUnitTransactionSparse = Partial<
  Omit<ZevUnitTransaction, keyof ZevUnitRecordBase>
>;
type ZevUnitEndingBalanceSparse = Partial<
  Omit<ZevUnitEndingBalance, keyof ZevUnitRecordBase>
>;

export interface ZevUnitRecord
  extends ZevUnitTransactionSparse,
    ZevUnitEndingBalanceSparse,
    ZevUnitRecordBase {}

export type ZevUnitRecordsObj = Partial<
  Record<
    TransactionType,
    Partial<
      Record<
        VehicleClass,
        Partial<Record<ZevClass, Partial<Record<ModelYear, Decimal>>>>
      >
    >
  >
>;
