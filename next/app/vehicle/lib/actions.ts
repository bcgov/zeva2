"use server";

import { prisma } from "@/lib/prisma";

export async function createVehicleComment(
  vehicleId: number,
  comment: string,
  userId: number,
) {
  return await prisma.vehicleComment.create({
    data: {
      comment,
      vehicle: { connect: { id: vehicleId } },
      createUser: { connect: { id: userId } },
    },
  });
}
