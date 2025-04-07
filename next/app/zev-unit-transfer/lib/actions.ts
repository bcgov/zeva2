import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ReferenceType,
  Role,
  TransactionType,
  ZevUnitTransfer,
  ZevUnitTransferContent,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";
import {
  getTransfer,
  getTransferWithContent,
  transferIsCovered,
  updateTransferStatusAndCreateHistory,
} from "./services";
import { transferFromSupplierRescindableStatuses } from "./constants";
import { getValidatedTransferContent } from "./utils";

export type ZevUnitTransferContentPayload = Record<
  keyof Omit<ZevUnitTransferContent, "id" | "zevUnitTransferId">,
  string
>;

export type ZevUnitTransferPayload = {
  transferToId: number;
  zevUnitTransferContent: ZevUnitTransferContentPayload[];
};

export const createTransfer = async (
  data: ZevUnitTransferPayload,
): Promise<ZevUnitTransfer | undefined> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const { zevUnitTransferContent, ...transferMain } = data;
  const transferToId = transferMain.transferToId;
  if (!userIsGov && userOrgId !== transferToId) {
    let transfer: ZevUnitTransfer | null = null;
    await prisma.$transaction(async (tx) => {
      const createdTransfer = await tx.zevUnitTransfer.create({
        data: {
          ...transferMain,
          transferFromId: userOrgId,
          status: ZevUnitTransferStatuses.DRAFT,
        },
      });
      const contentToBeAdded = getValidatedTransferContent(
        zevUnitTransferContent,
        createdTransfer.id,
      );
      await tx.zevUnitTransferContent.createMany({
        data: contentToBeAdded,
      });
      transfer = createdTransfer;
    });
    if (transfer) {
      return transfer;
    }
  }
};

export const saveTransfer = async (
  transferId: number,
  data: ZevUnitTransferPayload,
) => {
  const { userOrgId } = await getUserInfo();
  const { zevUnitTransferContent: newContent, ...transfer } = data;
  const {
    status,
    transferFromId,
    zevUnitTransferContent: oldContent,
  } = (await getTransferWithContent(transferId)) ?? {};
  if (
    userOrgId === transferFromId &&
    transfer.transferToId !== userOrgId &&
    status === ZevUnitTransferStatuses.DRAFT
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.zevUnitTransfer.update({
        where: {
          id: transferId,
        },
        data: {
          ...transfer,
        },
      });
      if (oldContent) {
        const idsOfContentToDelete = [];
        for (const content of oldContent) {
          idsOfContentToDelete.push(content.id);
        }
        await tx.zevUnitTransferContent.deleteMany({
          where: {
            id: {
              in: idsOfContentToDelete,
            },
          },
        });
      }
      const contentToBeAdded = getValidatedTransferContent(
        newContent,
        transferId,
      );
      await tx.zevUnitTransferContent.createMany({
        data: contentToBeAdded,
      });
    });
  }
};

export const submitTransferToPartner = async (transferId: number) => {
  const { userId, userOrgId } = await getUserInfo();
  const { status, transferFromId } = (await getTransfer(transferId)) ?? {};
  if (
    status === ZevUnitTransferStatuses.DRAFT &&
    transferFromId === userOrgId
  ) {
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        ZevUnitTransferStatuses.SUBMITTED_TO_TRANSFER_TO,
        null,
        tx,
      );
    });
  }
};

export const rescindTransfer = async (transferId: number, comment: string) => {
  const { userId, userOrgId } = await getUserInfo();
  const { status, transferFromId } = (await getTransfer(transferId)) ?? {};
  if (
    transferFromSupplierRescindableStatuses.some((x) => {
      return x === status;
    }) &&
    transferFromId === userOrgId
  ) {
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        ZevUnitTransferStatuses.RESCINDED_BY_TRANSFER_FROM,
        comment,
        tx,
      );
      if (comment) {
      }
    });
  }
};

export const transferToSupplierActionTransfer = async (
  transferId: number,
  newStatus: ZevUnitTransferStatuses,
  comment?: string,
) => {
  const { userId, userOrgId } = await getUserInfo();
  const { status, transferToId } = (await getTransfer(transferId)) ?? {};
  if (
    status === ZevUnitTransferStatuses.SUBMITTED_TO_TRANSFER_TO &&
    transferToId === userOrgId &&
    (newStatus === ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO ||
      newStatus === ZevUnitTransferStatuses.REJECTED_BY_TRANSFER_TO)
  )
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        newStatus,
        comment ?? null,
        tx,
      );
    });
};

export const govRecommendTransfer = async (
  transferId: number,
  recommendation: ZevUnitTransferStatuses,
  comment: string,
) => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  const { status } = (await getTransfer(transferId)) ?? {};
  if (
    userIsGov &&
    userRoles.some((role) => {
      return role === Role.ENGINEER_ANALYST;
    }) &&
    (status === ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO ||
      status === ZevUnitTransferStatuses.RETURNED_TO_ANALYST) &&
    (recommendation === ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV ||
      recommendation === ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV)
  ) {
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        recommendation,
        comment,
        tx,
      );
    });
  }
};

export const govReturnTransfer = async (
  transferId: number,
  comment: string,
) => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  const { status } = (await getTransfer(transferId)) ?? {};
  if (
    userIsGov &&
    userRoles.some((role) => role === Role.DIRECTOR) &&
    (status === ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV ||
      status === ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV)
  ) {
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        ZevUnitTransferStatuses.RETURNED_TO_ANALYST,
        comment,
        tx,
      );
    });
  }
};

export const govIssueTransfer = async (transferId: number) => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  const transfer = await getTransferWithContent(transferId);
  if (
    transfer &&
    userIsGov &&
    userRoles.some((role) => role === Role.DIRECTOR) &&
    (transfer.status === ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV ||
      transfer.status === ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV) &&
    (await transferIsCovered(transfer))
  ) {
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        ZevUnitTransferStatuses.APPROVED_BY_GOV,
        null,
        tx,
      );
      for (const item of transfer.zevUnitTransferContent) {
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
  }
};

export const govRejectTransfer = async (
  transferId: number,
  comment: string,
) => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  const { status } = (await getTransfer(transferId)) ?? {};
  if (
    userIsGov &&
    (status === ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV ||
      status === ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV) &&
    userRoles.some((role) => role === Role.DIRECTOR)
  ) {
    await prisma.$transaction(async (tx) => {
      await updateTransferStatusAndCreateHistory(
        transferId,
        userId,
        ZevUnitTransferStatuses.REJECTED_BY_GOV,
        comment,
        tx,
      );
    });
  }
};

export const deleteTransfer = async (transferId: number) => {
  const { userOrgId } = await getUserInfo();
  const { id, status, transferFromId } = (await getTransfer(transferId)) ?? {};
  if (
    userOrgId === transferFromId &&
    status === ZevUnitTransferStatuses.DRAFT
  ) {
    await prisma.zevUnitTransfer.update({
      where: {
        id: id,
      },
      data: {
        status: ZevUnitTransferStatuses.DELETED,
      },
    });
  }
};
