import { prisma } from "@/lib/prisma";
import { TransactionClient } from "@/types/prisma";
import { Vehicle } from "@/prisma/generated/client";

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
