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
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";

export type PenaltyCreditPayload = Omit<
  PenaltyCredit,
  "id" | "status" | "numberOfUnits"
> & { numberOfUnits: Decimal | string; comment?: string };

export const analystSubmit = async (
  data: PenaltyCreditPayload,
): Promise<DataOrErrorActionResponse<number>> => {
  let result = NaN;
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER))) {
    return getErrorActionResponse("Unauthorized!");
  }
  try {
    await validatePenaltyCredit(data);
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
  }
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
  if (Number.isNaN(result)) {
    return getErrorActionResponse("Something went wrong!");
  }
  return getDataActionResponse<number>(result);
};

export const directorUpdate = async (
  penaltyCreditId: number,
  status: PenaltyCreditStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.DIRECTOR))) {
    return getErrorActionResponse("Unauthorized!");
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
    return getErrorActionResponse("Invalid Action!");
  }
  try {
    await validatePenaltyCredit(penaltyCredit);
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
  }
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
  return getSuccessActionResponse();
};
