import { prisma } from "@/lib/prisma";
import { TransactionClient } from "@/types/prisma";
import { Prisma, VehicleStatus } from "@/prisma/generated/client";
import { Attachment } from "@/app/lib/services/attachments";

export const createHistory = async (
  vehicleId: number,
  userId: number,
  userAction: VehicleStatus,
  comment?: string,
  transactionClient?: TransactionClient,
): Promise<number> => {
  const client = transactionClient ?? prisma;
  const { id } = await client.vehicleHistory.create({
    data: {
      vehicleId,
      userId,
      userAction,
      comment,
    },
  });
  return id;
};

export const createAttachments = async (
  vehicleId: number,
  attachments: Attachment[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  const toCreate: Prisma.VehicleAttachmentUncheckedCreateInput[] = [];
  attachments.forEach((attachment) => {
    toCreate.push({
      vehicleId,
      fileName: attachment.fileName,
      objectName: attachment.objectName,
    });
  });
  await client.vehicleAttachment.createMany({
    data: toCreate,
  });
};
