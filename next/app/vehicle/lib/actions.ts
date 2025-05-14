"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createVehicleComment(vehicleId: number, comment: string) {
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  const createComment = async () => {
    return await prisma.vehicleComment.create({
      data: {
        comment,
        vehicleId,
        createUserId: userId,
      },
    });
  };
  // not sure about this logic; may need to change it later;
  // maybe adding vehicle comments is just for gov users?
  if (comment) {
    if (userIsGov) {
      createComment();
    } else {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (vehicle && vehicle.organizationId === userOrgId) {
        createComment();
      }
    }
  }
}
