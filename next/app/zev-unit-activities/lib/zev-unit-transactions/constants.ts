import {
  ZevUnitEndingBalanceModel,
  ZevUnitTransactionModel,
} from "@/prisma/generated/models";

export type SerializedZevUnitTransaction = Omit<
  ZevUnitTransactionModel,
  "numberOfUnits" | "timestamp"
> & { numberOfUnits: string; timestamp: string };

export type SerializedZevUnitBalanceRecord = Omit<
  ZevUnitEndingBalanceModel,
  "initialNumberOfUnits" | "finalNumberOfUnits"
> & { numberOfUnits: string };
