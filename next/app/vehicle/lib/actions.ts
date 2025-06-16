"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  VehicleStatus,
  VehicleClassCode,
  VehicleZevType,
  ModelYear,
} from "@/prisma/generated/client";

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

export async function createOrUpdateVehicle(formData: FormData) {
  const { userId, userOrgId } = await getUserInfo();
  const vehicleIdRaw = formData.get("vehicleId");
  const vehicleId = vehicleIdRaw ? Number(vehicleIdRaw) : null;
  const modelYear = formData.get("modelYear");
  const statusRaw = formData.get("status");
  let vehicleStatus;
  if (statusRaw === "draft") {
    vehicleStatus = VehicleStatus.DRAFT;
  } else if (statusRaw === "submitted") {
    vehicleStatus = VehicleStatus.SUBMITTED;
  }
  if (!vehicleStatus) {
    return { error: "Invalid status provided" };
  }
  if (!modelYear) {
    return { error: "Model year is required" };
  }
  const make = formData.get("make");
  if (!make) {
    return { error: "Make is required" };
  }
  const modelName = formData.get("modelName");
  if (!modelName) {
    return { error: "Model name is required" };
  }
  const zevType = formData.get("zevType");
  if (!zevType) {
    return { error: "Zev type is required" };
  }
  const hasPassedUs06Test = formData.get("hasPassedUs06Test") === "true";

  const range = formData.get("range");
  if (!range) {
    return { error: "range is required" };
  }
  const rangeNum = Number(range);
  if (isNaN(rangeNum)) {
    return { error: "Range must be a number." };
  }
  const bodyType = formData.get("bodyType") as VehicleClassCode;
  if (!bodyType) {
    return { error: "Body type is required" };
  }
  const weightKg = formData.get("gvwr");
  if (!weightKg) {
    return { error: "weight is required" };
  }
  const weightNum = Number(weightKg);
  if (isNaN(weightNum)) {
    return { error: "Range must be a number." };
  }
  if (vehicleId) {
    console.log("Updating old vehicle");
    // it already exists in the db and the user is editing
    const vehicleToUpdate = await prisma.vehicle.findUniqueOrThrow({
      where: { id: vehicleId },
    });
    if (userOrgId !== vehicleToUpdate.organizationId) {
      throw new Error("Permission Denied");
    }
    //update vehicle to update
    await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          modelYear: modelYear as ModelYear,
          make: String(make),
          modelName: String(modelName),
          vehicleZevType: zevType as VehicleZevType,
          range: Number(range),
          vehicleClassCode: bodyType as VehicleClassCode,
          hasPassedUs06Test: hasPassedUs06Test,
          status: vehicleStatus,
          weightKg: Number(weightKg),
        },
      });
      await tx.vehicleChangeHistory.create({
        data: {
          modelYear: modelYear as ModelYear,
          make: String(make),
          modelName: String(modelName),
          vehicleZevType: zevType as VehicleZevType,
          range: Number(range),
          vehicleClassCode: bodyType as VehicleClassCode,
          validationStatus: vehicleStatus,
          weightKg: Number(weightKg),
          organizationId: userOrgId,
          createUserId: userId,
          vehicleId: vehicleToUpdate.id,
        },
      });
    });
  } else {
    //it is new
    await prisma.$transaction(async (tx) => {
      const newVehicle = await tx.vehicle.create({
        data: {
          modelYear: modelYear as ModelYear,
          make: String(make),
          modelName: String(modelName),
          vehicleZevType: zevType as VehicleZevType,
          range: Number(range),
          vehicleClassCode: bodyType as VehicleClassCode,
          status: vehicleStatus,
          weightKg: Number(weightKg),
          hasPassedUs06Test: hasPassedUs06Test,
          isActive: true,
          organizationId: userOrgId,
        },
      });

      await tx.vehicleChangeHistory.create({
        data: {
          modelYear: modelYear as ModelYear,
          make: String(make),
          modelName: String(modelName),
          vehicleZevType: zevType as VehicleZevType,
          range: Number(range),
          vehicleClassCode: bodyType as VehicleClassCode,
          validationStatus: vehicleStatus,
          weightKg: Number(weightKg),
          organizationId: userOrgId,
          createUserId: userId,
          vehicleId: newVehicle.id,
        },
      });
    });
  }
  return { success: true };
}
