import { prisma } from "@/lib/prisma";
import { TransactionClient } from "@/types/prisma";
import { Prisma, VehicleStatus } from "@/prisma/generated/client";
import { VehicleFile } from "./actions";
import { removeObjects } from "@/app/lib/minio";
import { getAttachmentFullObjectName } from "./utils";

export const createHistory = async (
  vehicleId: number,
  userId: number,
  userAction: VehicleStatus,
  comment?: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.vehicleHistory.create({
    data: {
      vehicleId,
      userId,
      userAction,
      comment,
    },
  });
};

export const createAttachments = async (
  vehicleId: number,
  files: VehicleFile[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  const toCreate: Prisma.VehicleAttachmentUncheckedCreateInput[] = [];
  files.forEach((file) => {
    toCreate.push({
      vehicleId,
      filename: file.filename,
      minioObjectName: file.objectName,
    });
  });
  await client.vehicleAttachment.createMany({
    data: toCreate,
  });
};

export const deleteAttachments = async (
  orgId: number,
  files: VehicleFile[],
) => {
  const objectNames = files.map((file) => {
    return getAttachmentFullObjectName(orgId, file.objectName);
  });
  await removeObjects(objectNames);
};
