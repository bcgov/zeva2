import { prisma } from "@/lib/prisma";
import { TransactionClient } from "@/types/prisma";
import {
  ModelYear,
  VehicleHistoryStatus,
  VehicleStatus,
} from "@/prisma/generated/enums";
import { Attachment } from "@/app/lib/services/attachments";

export const createHistory = async (
  vehicleId: number,
  userId: number,
  userAction: VehicleHistoryStatus,
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

export const getConflictingVehicle = async (
  orgId: number,
  make: string,
  modelName: string,
  modelYear: ModelYear,
) => {
  const conflictingVehicle = await prisma.vehicle.findFirst({
    where: {
      organizationId: orgId,
      make: make,
      modelName: modelName,
      modelYear: modelYear,
      isActive: true,
      status: VehicleStatus.VALIDATED,
    },
    select: {
      id: true,
    },
  });
  return conflictingVehicle;
};

export const updateAttachments = async (
  vehicleId: number,
  attachments: Attachment[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  for (const attachment of attachments) {
    // throws if record to update does not exist in table
    await client.vehicleAttachment.update({
      where: {
        objectName: attachment.objectName,
      },
      data: {
        vehicleId,
        fileName: attachment.fileName,
      },
    });
  }
};

export const deleteAttachments = async (
  vehicleId: number,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.vehicleAttachment.deleteMany({
    where: {
      vehicleId,
    },
  });
};
