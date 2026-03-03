import { prisma } from "@/lib/prisma";
import { TransactionClient } from "@/types/prisma";
import { Attachment } from "@/app/lib/constants/attachment";
import { AgreementStatus } from "@/prisma/generated/enums";

export const createHistory = async (
  agreementId: number,
  userId: number,
  userAction: AgreementStatus,
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

export const createAttachments = async (
  agreementId: number,
  attachments: Attachment[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  const toCreate = [];
  for (const attachment of attachments) {
    toCreate.push({
      agreementId,
      objectName: attachment.objectName,
      fileName: attachment.fileName,
    });
  }
  await client.agreementAttachment.createMany({
    data: toCreate,
  });
};

export const deleteAttachments = async (
  agreementId: number,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.agreementAttachment.deleteMany({
    where: {
      agreementId,
    },
  });
};
