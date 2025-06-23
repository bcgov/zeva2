"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  PenaltyCredit,
  PenaltyCreditStatus,
  ReferenceType,
  Role,
  TransactionType,
} from "@/prisma/generated/client";
import { createHistory, validatePenaltyCredit } from "./services";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import { getPenaltyCreditTransactionDate } from "./utils";

export type PenaltyCreditPayload = Omit<
  PenaltyCredit,
  "id" | "status" | "numberOfUnits"
> & { numberOfUnits: Decimal | string; comment?: string };

export const analystSubmit = async (data: PenaltyCreditPayload) => {
  let result = NaN;
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.ENGINEER_ANALYST))) {
    throw new Error("Unauthorized!");
  }
  await validatePenaltyCredit(data);
  const comment = data.comment;
  delete data.comment;
  await prisma.$transaction(async (tx) => {
    const { id: penaltyCreditId } = await tx.penaltyCredit.create({
      data: {
        ...data,
        status: PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      },
    });
    result = penaltyCreditId;
    await createHistory(
      penaltyCreditId,
      userId,
      PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      comment,
      tx,
    );
  });
  return result;
};

export const directorUpdate = async (
  penaltyCreditId: number,
  status: PenaltyCreditStatus,
  comment?: string,
) => {
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.DIRECTOR))) {
    throw new Error("Unauthorized!");
  }
  const penaltyCredit = await prisma.penaltyCredit.findUnique({
    where: {
      id: penaltyCreditId,
      status: PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
    },
  });
  if (
    !penaltyCredit ||
    (status !== PenaltyCreditStatus.APPROVED &&
      status !== PenaltyCreditStatus.REJECTED)
  ) {
    throw new Error("Invalid Action");
  }
  await validatePenaltyCredit(penaltyCredit);
  await prisma.$transaction(async (tx) => {
    await tx.penaltyCredit.update({
      where: {
        id: penaltyCreditId,
      },
      data: {
        status,
      },
    });
    if (status === PenaltyCreditStatus.APPROVED) {
      await tx.zevUnitTransaction.create({
        data: {
          organizationId: penaltyCredit.organizationId,
          type: TransactionType.CREDIT,
          referenceType: ReferenceType.PENALTY_CREDITS,
          referenceId: penaltyCredit.id,
          numberOfUnits: penaltyCredit.numberOfUnits,
          vehicleClass: penaltyCredit.vehicleClass,
          zevClass: penaltyCredit.zevClass,
          modelYear: penaltyCredit.modelYear,
          timestamp: getPenaltyCreditTransactionDate(
            penaltyCredit.complianceYear,
          ),
        },
      });
    }
    await createHistory(penaltyCreditId, userId, status, comment, tx);
  });
};
