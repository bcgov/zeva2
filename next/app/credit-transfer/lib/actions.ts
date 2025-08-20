"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditTransferStatus,
  ModelYear,
  ReferenceType,
  Role,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import {
  createTransferHistory,
  transferIsCovered,
  updateTransferStatusAndCreateHistory,
} from "./services";
import { transferFromSupplierRescindableStatuses } from "./constants";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { Decimal } from "@/prisma/generated/client/runtime/library";

export type CreditTransferPayload = {
  transferToId: number;
  transferContent: {
    vehicleClass: VehicleClass;
    zevClass: ZevClass;
    modelYear: ModelYear;
    numberOfUnits: string;
    dollarValuePerUnit: string;
  }[];
};

export const submitTransfer = async (
  payload: CreditTransferPayload,
  comment?: string,
): Promise<DataOrErrorActionResponse<number>> => {
  let result = NaN;
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  if (payload.transferContent.length === 0) {
    throw new Error("No transfer content!");
  }
  await prisma.$transaction(async (tx) => {
    const { id } = await tx.creditTransfer.create({
      data: {
        transferFromId: userOrgId,
        transferToId: payload.transferToId,
        status: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        supplierStatus: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
      },
    });
    result = id;
    const contentToCreate = payload.transferContent.map((content) => {
      return {
        ...content,
        creditTransferId: id,
        numberOfUnits: new Decimal(content.numberOfUnits),
        dollarValuePerUnit: new Decimal(content.dollarValuePerUnit),
      };
    });
    await tx.creditTransferContent.createMany({
      data: contentToCreate,
    });
    await createTransferHistory(
      {
        creditTransferId: id,
        userId,
        userAction: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        comment,
      },
      tx,
    );
  });
  return getDataActionResponse(result);
};

export const rescindTransfer = async (
  transferId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userOrgId } = await getUserInfo();
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      status: {
        in: [...transferFromSupplierRescindableStatuses],
      },
      transferFromId: userOrgId,
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Transfer not found!");
  }
  await prisma.$transaction(async (tx) => {
    await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
      CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const transferToSupplierActionTransfer = async (
  transferId: number,
  newStatus: CreditTransferStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userOrgId } = await getUserInfo();
  if (
    newStatus !== CreditTransferStatus.APPROVED_BY_TRANSFER_TO &&
    newStatus !== CreditTransferStatus.REJECTED_BY_TRANSFER_TO
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      transferToId: userOrgId,
      status: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Transfer not found!");
  }
  await prisma.$transaction(async (tx) => {
    await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      newStatus,
      newStatus,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const govRecommendTransfer = async (
  transferId: number,
  recommendation: CreditTransferStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
  }
  if (
    recommendation !== CreditTransferStatus.RECOMMEND_APPROVAL_GOV &&
    recommendation !== CreditTransferStatus.RECOMMEND_REJECTION_GOV
  ) {
    return getErrorActionResponse("Invalid action!");
  }
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      status: {
        in: [
          CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
          CreditTransferStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Transfer not found!");
  }
  await prisma.$transaction(async (tx) => {
    await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      recommendation,
      CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const directorReturnTransfer = async (
  transferId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      status: {
        in: [
          CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
          CreditTransferStatus.RECOMMEND_REJECTION_GOV,
        ],
      },
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Transfer not found!");
  }
  await prisma.$transaction(async (tx) => {
    await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.RETURNED_TO_ANALYST,
      CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const directorIssueTransfer = async (
  transferId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      status: CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
    },
    include: {
      creditTransferContent: true,
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Transfer not found!");
  }
  const isTransferCovered = await transferIsCovered(transfer);
  if (!isTransferCovered) {
    return getErrorActionResponse("Transfer not covered!");
  }
  await prisma.$transaction(async (tx) => {
    await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.APPROVED_BY_GOV,
      CreditTransferStatus.APPROVED_BY_GOV,
      comment,
      tx,
    );
    for (const item of transfer.creditTransferContent) {
      const data = {
        referenceType: ReferenceType.TRANSFER,
        referenceId: transferId,
        numberOfUnits: item.numberOfUnits,
        vehicleClass: item.vehicleClass,
        zevClass: item.zevClass,
        modelYear: item.modelYear,
      };
      await tx.zevUnitTransaction.create({
        data: {
          ...data,
          organizationId: transfer.transferFromId,
          type: TransactionType.TRANSFER_AWAY,
        },
      });
      await tx.zevUnitTransaction.create({
        data: {
          ...data,
          organizationId: transfer.transferToId,
          type: TransactionType.CREDIT,
        },
      });
    }
  });
  return getSuccessActionResponse();
};

export const directorRejectTransfer = async (
  transferId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      status: CreditTransferStatus.RECOMMEND_REJECTION_GOV,
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Transfer not found!");
  }
  await prisma.$transaction(async (tx) => {
    await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.REJECTED_BY_GOV,
      CreditTransferStatus.REJECTED_BY_GOV,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};
