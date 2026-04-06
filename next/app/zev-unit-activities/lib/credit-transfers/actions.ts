"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditTransferStatus,
  ModelYear,
  Notification,
  ReferenceType,
  Role,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
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
import { Decimal } from "decimal.js";
import { addJobToEmailQueue } from "@/app/lib/services/queue";

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

export const saveTransfer = async (
  payload: CreditTransferPayload,
  creditTransferId?: number,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  if (payload.transferContent.length === 0) {
    return getErrorActionResponse("No transfer content!");
  }
  if (creditTransferId) {
    const transfer = await prisma.creditTransfer.findUnique({
      where: {
        id: creditTransferId,
        transferFromId: userOrgId,
        status: CreditTransferStatus.DRAFT,
      },
      select: {
        id: true,
      },
    });
    if (!transfer) {
      return getErrorActionResponse("Invalid action!");
    }
  }
  let transferId = creditTransferId ?? Number.NaN;
  await prisma.$transaction(async (tx) => {
    if (transferId) {
      await tx.creditTransferContent.deleteMany({
        where: {
          creditTransferId,
        },
      });
    } else {
      const { id } = await tx.creditTransfer.create({
        data: {
          transferFromId: userOrgId,
          transferToId: payload.transferToId,
          status: CreditTransferStatus.DRAFT,
        },
      });
      transferId = id;
    }
    const contentToCreate = payload.transferContent.map((content) => {
      return {
        ...content,
        creditTransferId: transferId,
        numberOfUnits: new Decimal(content.numberOfUnits),
        dollarValuePerUnit: new Decimal(content.dollarValuePerUnit),
      };
    });
    await tx.creditTransferContent.createMany({
      data: contentToCreate,
    });
  });
  return getDataActionResponse(transferId);
};

export const submitTransfer = async (
  creditTransferId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: creditTransferId,
      transferFromId: userOrgId,
      status: CreditTransferStatus.DRAFT,
    },
    select: {
      id: true,
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditTransfer.update({
      where: {
        id: creditTransferId,
      },
      data: {
        status: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
      },
    });
    const historyId = await createTransferHistory(
      {
        creditTransferId,
        userId,
        userAction: CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
        comment,
      },
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
  });
  return getSuccessActionResponse();
};

export const deleteTransfer = async (
  transferId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userOrgId } = await getUserInfo();
  const transfer = await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
      status: CreditTransferStatus.DRAFT,
      transferFromId: userOrgId,
    },
    select: {
      id: true,
    },
  });
  if (!transfer) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditTransferContent.deleteMany({
      where: {
        creditTransferId: transferId,
      },
    });
    await tx.creditTransfer.delete({
      where: {
        id: transferId,
      },
    });
  });
  return getSuccessActionResponse();
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
    const historyId = await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
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
    const historyId = await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      newStatus,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
  });
  return getSuccessActionResponse();
};

export const govRecommendTransfer = async (
  transferId: number,
  recommendation: CreditTransferStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
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
    const historyId = await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      recommendation,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
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
    const historyId = await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.RETURNED_TO_ANALYST,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
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
    const historyId = await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
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
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
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
    const historyId = await updateTransferStatusAndCreateHistory(
      transferId,
      userId,
      CreditTransferStatus.REJECTED_BY_GOV,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_TRANSFER,
    });
  });
  return getSuccessActionResponse();
};
