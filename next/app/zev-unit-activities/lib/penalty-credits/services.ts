import { prisma } from "@/lib/prisma";
import { PenaltyCreditStatus } from "@/prisma/generated/enums";
import { TransactionClient } from "@/types/prisma";

export const createHistory = async (
  penaltyCreditId: number,
  userId: number,
  userAction: PenaltyCreditStatus,
  comment?: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.penaltyCreditHistory.create({
    data: {
      penaltyCreditId,
      userId,
      userAction,
      comment,
    },
  });
};
