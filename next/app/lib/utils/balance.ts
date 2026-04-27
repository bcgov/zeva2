import { sumBalance } from "@/lib/utils/zevUnit";
import {
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import { fetchBalance } from "../services/balance";

export const sumCreditsForClass = (
  balance: Awaited<ReturnType<typeof fetchBalance>>,
  zevClass: ZevClass,
) => {
  if (!balance) {
    return "0.00";
  }
  if (balance === "deficit") {
    return "Deficit";
  }
  return sumBalance(
    balance,
    TransactionType.CREDIT,
    VehicleClass.REPORTABLE,
    zevClass,
  ).toFixed(2);
};
