"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  PenaltyCreditStatus,
  ReferenceType,
  Role,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import { PenaltyCreditModel } from "@/prisma/generated/models";
import { createHistory } from "./services";
import { getPenaltyCreditTransactionDate } from "./utilsServer";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";

export type PenaltyCreditPayload = Omit<
  PenaltyCreditModel,
  "id" | "status" | "numberOfUnits"
> & { numberOfUnits: string };

export const analystCreate = async (
  data: PenaltyCreditPayload,
): Promise<DataOrErrorActionResponse<number>> => {
  let result = NaN;
  const { userIsGov, userRoles } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER))) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { id: penaltyCreditId } = await prisma.penaltyCredit.create({
    data: {
      ...data,
      status: PenaltyCreditStatus.DRAFT,
    },
  });
  result = penaltyCreditId;
  return getDataActionResponse<number>(result);
};

export const analystSave = async (
  penaltyCreditId: number,
  vehicleClass: VehicleClass,
  zevClass: ZevClass,
  modelYear: ModelYear,
  numberOfUnits: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER))) {
    return getErrorActionResponse("Unauthorized!");
  }
  const penaltyCredit = await prisma.penaltyCredit.findUnique({
    where: {
      id: penaltyCreditId,
      status: {
        in: [
          PenaltyCreditStatus.DRAFT,
          PenaltyCreditStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
  });
  if (!penaltyCredit) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.penaltyCredit.update({
    where: {
      id: penaltyCreditId,
    },
    data: {
      vehicleClass,
      zevClass,
      modelYear,
      numberOfUnits,
    },
  });
  return getSuccessActionResponse();
};

export const analystSubmit = async (
  penaltyCreditId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER))) {
    return getErrorActionResponse("Unauthorized!");
  }
  const penaltyCredit = await prisma.penaltyCredit.findUnique({
    where: {
      id: penaltyCreditId,
      status: {
        in: [
          PenaltyCreditStatus.DRAFT,
          PenaltyCreditStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
  });
  if (!penaltyCredit) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.penaltyCredit.update({
      where: {
        id: penaltyCreditId,
      },
      data: {
        status: PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      },
    });
    await createHistory(
      penaltyCreditId,
      userId,
      PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const analystDelete = async (
  penaltyCreditId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER))) {
    return getErrorActionResponse("Unauthorized!");
  }
  const penaltyCredit = await prisma.penaltyCredit.findUnique({
    where: {
      id: penaltyCreditId,
      status: {
        in: [
          PenaltyCreditStatus.DRAFT,
          PenaltyCreditStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
  });
  if (!penaltyCredit) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.penaltyCreditHistory.deleteMany({
      where: {
        penaltyCreditId,
      },
    });
    await tx.penaltyCredit.delete({
      where: {
        id: penaltyCreditId,
      },
    });
  });
  return getSuccessActionResponse();
};

export const directorReturn = async (
  penaltyCreditId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!(userIsGov && userRoles.includes(Role.DIRECTOR))) {
    return getErrorActionResponse("Unauthorized!");
  }
  const penaltyCredit = await prisma.penaltyCredit.findUnique({
    where: {
      id: penaltyCreditId,
      status: PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
    },
  });
  if (!penaltyCredit) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.penaltyCredit.update({
      where: {
        id: penaltyCreditId,
      },
      data: {
        status: PenaltyCreditStatus.RETURNED_TO_ANALYST,
      },
    });
    await createHistory(
      penaltyCreditId,
      userId,
      PenaltyCreditStatus.RETURNED_TO_ANALYST,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const directorApprove = async (
  penaltyCreditId: number,
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
  if (!penaltyCredit) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.penaltyCredit.update({
      where: {
        id: penaltyCreditId,
      },
      data: {
        status: PenaltyCreditStatus.APPROVED,
      },
    });
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
    await createHistory(
      penaltyCreditId,
      userId,
      PenaltyCreditStatus.APPROVED,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};
