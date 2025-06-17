"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VehicleStatus, Vehicle } from "@/prisma/generated/client";
import { createHistory } from "./services";

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

export async function updateStatus(
  vehicleId: number,
  newStatus: VehicleStatus,
) {
  const { userId, userIsGov, userOrgId } = await getUserInfo();

  if (!userIsGov) {
    const { organizationId: vehicleOrgId, status } =
      await prisma.vehicle.findUniqueOrThrow({
        where: {
          id: vehicleId,
        },
      });
    if (userOrgId !== vehicleOrgId) {
      throw new Error("Permission Denied");
    }
    if (
      newStatus !== VehicleStatus.SUBMITTED &&
      newStatus !== VehicleStatus.DELETED
    ) {
      throw new Error("Only government users can complete this status change");
    }
    if (
      (status !== VehicleStatus.DRAFT &&
        newStatus == VehicleStatus.SUBMITTED) ||
      newStatus == VehicleStatus.DELETED
    ) {
      throw new Error("That status change cannot be performed");
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: newStatus },
    });
    const mostRecentHistory = await tx.vehicleChangeHistory.findFirst({
      where: { vehicleId: vehicleId },
      omit: {
        id: true,
        createTimestamp: true,
      },
      orderBy: { createTimestamp: "desc" },
    });
    if (mostRecentHistory) {
      await tx.vehicleChangeHistory.create({
        data: {
          ...mostRecentHistory,
          createUserId: userId,
          validationStatus: newStatus,
        },
      });
    } else {
      // do something here? Or will there always be a mostRecentHistory (one is created when a vehicle is created)?
    }
  });
}

export type VehiclePayload = Omit<
  Vehicle,
  "id" | "organizationId" | "weightKg" | "isActive"
> & {
  id?: number;
  weightKg: string;
};

export async function createOrUpdateVehicle(
  data: VehiclePayload,
): Promise<number | null> {
  let result = null;
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  const vehicleId = data.id;
  if (!vehicleId) {
    // create new vehicle:
    if (userIsGov) {
      throw new Error("Gov users cannot create vehicles?");
    }
    await prisma.$transaction(async (tx) => {
      const newVehicle = await tx.vehicle.create({
        data: { ...data, organizationId: userOrgId, isActive: true },
      });
      result = newVehicle.id;
      await createHistory(newVehicle, userId, tx);
    });
    return result;
  }
  // update vehicle:
  const vehicleToUpdate = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
  });
  if (
    !vehicleToUpdate ||
    (!userIsGov && userOrgId !== vehicleToUpdate.organizationId)
  ) {
    throw new Error("Unauthorized!");
  }
  await prisma.$transaction(async (tx) => {
    const updatedVehicle = await tx.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: { ...data, organizationId: userOrgId },
    });
    await createHistory(updatedVehicle, userId, tx);
  });
  return vehicleId;
}
