"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VehicleStatus } from "@/prisma/generated/client";

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

export async function updateStatus(status: VehicleStatus, vehicleId: number) {
  const { userId, userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov) {
    const { organizationId: vehicleOrgId } =
      await prisma.vehicle.findUniqueOrThrow({
        where: {
          id: vehicleId,
        },
      });
    if (userOrgId !== vehicleOrgId) {
      throw new Error("Permission Denied");
    }
    if (
      status !== VehicleStatus.SUBMITTED &&
      status !== VehicleStatus.DELETED
    ) {
      throw new Error("Only government users can complete this status change");
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });
    const mostRecentHistory = await tx.vehicleChangeHistory.findFirst({
      where: { vehicleId: vehicleId },
      orderBy: { createTimestamp: "desc" },
    });
    if (mostRecentHistory) {
      await tx.vehicleChangeHistory.create({
        data: {
          ...mostRecentHistory,
          id: undefined,
          createTimestamp: new Date(),
          createUserId: userId,
          validationStatus: status,
        },
      });
    } else {
      // do something here? Or will there always be a mostRecentHistory (one is created when a vehicle is created)?
    }
  });
}
