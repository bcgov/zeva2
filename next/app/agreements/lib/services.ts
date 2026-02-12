import { prisma } from "@/lib/prisma";
import { AgreementHistoryStatus } from "@/prisma/generated/client";
import { TransactionClient } from "@/types/prisma";
import { Attachment } from "@/app/lib/services/attachments";

export const getSupplierSelections = async () => {
  return await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isGovernment: false,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const createHistory = async (
  agreementId: number,
  userId: number,
  userAction: AgreementHistoryStatus,
  comment?: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.agreementHistory.create({
    data: {
      agreementId,
      userId,
      userAction,
      comment,
    },
  });
};

export const updateAttachments = async (
  agreementId: number,
  attachments: Attachment[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  for (const attachment of attachments) {
    // throws if record to update does not exist in table
    await client.agreementAttachment.update({
      where: {
        objectName: attachment.objectName,
      },
      data: {
        agreementId,
        fileName: attachment.fileName,
      },
    });
  }
};
