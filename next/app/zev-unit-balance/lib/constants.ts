import {
  ZevUnitEndingBalanceModel,
  ZevUnitTransactionModel,
} from "@/prisma/generated/models";

export type SerializedZevUnitTransaction = Omit<
  ZevUnitTransactionModel,
  "numberOfUnits" | "timestamp"
> & { numberOfUnits: string; timestamp: string };

export type SerializedZevUnitEndingBalanceRecord = Omit<
  ZevUnitEndingBalanceModel,
  "initialNumberOfUnits" | "finalNumberOfUnits"
> & { finalNumberOfUnits: string };
