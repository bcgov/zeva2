"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VehicleStatus, Vehicle } from "@/prisma/generated/client";
import {
  createAttachments,
  createHistory,
  deleteAttachments,
} from "./services";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { getPresignedPutObjectUrl } from "@/app/lib/minio";
import { randomUUID } from "crypto";

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
): Promise<ErrorOrSuccessActionResponse> {
  const { userId, userIsGov, userOrgId } = await getUserInfo();

  if (!userIsGov) {
    const { organizationId: vehicleOrgId, status } =
      await prisma.vehicle.findUniqueOrThrow({
        where: {
          id: vehicleId,
        },
      });
    if (userOrgId !== vehicleOrgId) {
      return getErrorActionResponse("Permission Denied!");
    }
    if (
      newStatus !== VehicleStatus.SUBMITTED &&
      newStatus !== VehicleStatus.DELETED
    ) {
      return getErrorActionResponse(
        "Only government users can complete this status change!",
      );
    }
    if (
      (status !== VehicleStatus.DRAFT &&
        newStatus == VehicleStatus.SUBMITTED) ||
      newStatus == VehicleStatus.DELETED
    ) {
      return getErrorActionResponse("That status change cannot be performed!");
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
  return getSuccessActionResponse();
}

export type VehiclePutObjectData = {
  objectName: string;
  url: string;
};

export const getPutObjectData = async (
  numberOfFiles: number,
): Promise<VehiclePutObjectData[]> => {
  const result: VehiclePutObjectData[] = [];
  for (let i = 0; i < numberOfFiles; i++) {
    const objectName = randomUUID();
    const url = await getPresignedPutObjectUrl(objectName);
    result.push({
      objectName,
      url,
    });
  }
  return result;
};

export type VehiclePayload = Omit<
  Vehicle,
  "id" | "organizationId" | "weightKg" | "isActive"
> & {
  id?: number;
  weightKg: string;
};

export type VehicleFile = {
  filename: string;
  objectName: string;
  size: number;
  mimeType?: string;
};

export async function createOrUpdateVehicle(
  data: VehiclePayload,
  files: VehicleFile[],
): Promise<DataOrErrorActionResponse<number>> {
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  const vehicleId = data.id;
  try {
    if (!vehicleId) {
      // create new vehicle:
      if (userIsGov) {
        return getErrorActionResponse(
          "Government users cannot create vehicles!",
        );
      }
      let newVehicleId = NaN;
      await prisma.$transaction(async (tx) => {
        const newVehicle = await tx.vehicle.create({
          data: { ...data, organizationId: userOrgId, isActive: true },
        });
        newVehicleId = newVehicle.id;
        await createAttachments(newVehicleId, userId, files, tx);
        await createHistory(newVehicle, userId, tx);
      });
      return getDataActionResponse<number>(newVehicleId);
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
      return getErrorActionResponse("Unauthorized!");
    }
    await prisma.$transaction(async (tx) => {
      const updatedVehicle = await tx.vehicle.update({
        where: {
          id: vehicleId,
        },
        data: { ...data, organizationId: userOrgId },
      });
      await createAttachments(vehicleId, userId, files, tx);
      await createHistory(updatedVehicle, userId, tx);
    });
    return getDataActionResponse<number>(vehicleId);
  } catch (e) {
    await deleteAttachments(files);
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
}
