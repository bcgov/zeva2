import { prisma } from "@/lib/prisma";
import { AgreementHistoryStatus } from "@/prisma/generated/enums";
import { TransactionClient } from "@/types/prisma";
import { Attachment } from "@/app/lib/services/attachments";

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
