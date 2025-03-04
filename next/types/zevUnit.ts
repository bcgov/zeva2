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

// both ZevUnitTransactions and ZevUnitEndingBalances can be of type ZevUnitRecord;
// a ZevUnitEndingBalance will need to be modified slightly
// (its finalNumberOfUnits value will need to be copied over to a numberOfUnits field)
export interface ZevUnitRecord
  extends ZevUnitTransactionSparse,
    ZevUnitEndingBalanceSparse,
    ZevUnitRecordBase {}

// a structure of ZevUnitRecords that may prove useful for rendering purposes
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
