import { prisma } from "@/lib/prisma";
import { TransactionClient } from "@/types/prisma";
import { Prisma, Vehicle } from "@/prisma/generated/client";
import { VehicleFile } from "./actions";
import { removeObject } from "@/app/lib/minio";

export const createHistory = async (
  vehicle: Vehicle,
  userId: number,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.vehicleChangeHistory.create({
    data: {
      vehicleId: vehicle.id,
      vehicleClassCode: vehicle.vehicleClassCode,
      vehicleZevType: vehicle.vehicleZevType,
      range: vehicle.range,
      make: vehicle.make,
      weightKg: vehicle.weightKg,
      modelName: vehicle.modelName,
      modelYear: vehicle.modelYear,
      validationStatus: vehicle.status,
      organizationId: vehicle.organizationId,
      createUserId: userId,
    },
  });
};

export const createAttachments = async (
  vehicleId: number,
  userId: number,
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
      size: file.size,
      mimeType: file.mimeType,
      createUser: userId,
    });
  });
  await client.vehicleAttachment.createMany({
    data: toCreate,
  });
};

export const deleteAttachments = async (files: VehicleFile[]) => {
  for (const file of files) {
    await removeObject(file.objectName);
  }
};
