"use server";

import { isVehicleStatus } from "@/app/lib/utils/typeGuards";
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

export async function handleValidateorReject(
  choice: string,
  vehicleId: number,
) {
  const { userId, userIsGov } = await getUserInfo();

  const statusMap: Record<string, VehicleStatus> = {
    validate: VehicleStatus.VALIDATED,
    reject: VehicleStatus.REJECTED,
    delete: VehicleStatus.DELETED,
    "request changes": VehicleStatus.CHANGES_REQUESTED,
    submit: VehicleStatus.SUBMITTED,
  };

  const validation_status = statusMap[choice];
  if (
    !userIsGov &&
    !(
      [VehicleStatus.SUBMITTED, VehicleStatus.DELETED] as VehicleStatus[]
    ).includes(validation_status)
  ) {
    throw new Error("Only government users can complete this status change");
  }
  if (!validation_status) {
    throw new Error(`Unsupported action: ${choice}`);
  }
  //update the status
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: validation_status },
  });
  //grab the most recent history record
  const mostRecentHistory = await prisma.vehicleChangeHistory.findFirst({
    where: { vehicleId: vehicleId },
    orderBy: { createTimestamp: "desc" },
    select: {
      vehicleId: true,
      vehicleClassCode: true,
      vehicleZevType: true,
      createTimestamp: true,
      validationStatus: true,
      modelName: true,
      createUserId: true,
      range: true,
      weightKg: true,
      modelYearId: true,
      organizationId: true,
      userRole: true,
    },
  });

  const {
    id,
    createTimestamp,
    createUserId: _prevUserId,
    validationStatus: _prevStatus,
    ...rest
  } = mostRecentHistory;
  //create a new history record with a copy of the most
  //recent one and only change the status/update user
  await prisma.vehicleChangeHistory.create({
    data: {
      ...rest,
      vehicleId: vehicleId,
      validationStatus: validation_status,
      createUserId: userId,
    },
  });
}
