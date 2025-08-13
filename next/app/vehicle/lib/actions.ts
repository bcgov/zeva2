"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VehicleStatus, Vehicle, Prisma } from "@/prisma/generated/client";
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
import {
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
} from "@/app/lib/minio";
import { randomUUID } from "crypto";
import { getNumberOfUnits, getVehicleClass, getZevClass } from "./utils";

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
  | "id"
  | "organizationId"
  | "status"
  | "weightKg"
  | "isActive"
  | "vehicleClass"
  | "zevClass"
  | "numberOfUnits"
> & {
  weightKg: string;
};

export type VehicleFile = {
  filename: string;
  objectName: string;
  size: number;
  mimeType?: string;
};

export async function submitVehicle(
  data: VehiclePayload,
  files: VehicleFile[],
  comment?: string,
): Promise<DataOrErrorActionResponse<number>> {
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Government users cannot submit vehicles!");
  }
  let vehicleId = NaN;
  const modelYear = data.modelYear;
  const range = data.range;
  try {
    const vehicleClass = getVehicleClass(modelYear, data.weightKg);
    const zevClass = getZevClass(modelYear, data.vehicleZevType, range);
    const numberOfUnits = getNumberOfUnits(
      zevClass,
      range,
      data.hasPassedUs06Test,
    );
    await prisma.$transaction(async (tx) => {
      const newVehicle = await tx.vehicle.create({
        data: {
          ...data,
          organizationId: userOrgId,
          status: VehicleStatus.SUBMITTED,
          isActive: true,
          vehicleClass,
          zevClass,
          numberOfUnits,
        },
      });
      vehicleId = newVehicle.id;
      await createAttachments(vehicleId, userId, files, tx);
      await createHistory(
        vehicleId,
        userId,
        VehicleStatus.SUBMITTED,
        comment,
        tx,
      );
    });
  } catch (e) {
    await deleteAttachments(files);
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getDataActionResponse<number>(vehicleId);
}

export const updateStatus = async (
  id: number,
  status: VehicleStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userOrgId } = await getUserInfo();
  const whereClause: Prisma.VehicleWhereUniqueInput = { id };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  const vehicle = await prisma.vehicle.findUnique({
    where: whereClause,
    select: {
      status: true,
    },
  });
  if (!vehicle) {
    return getErrorActionResponse("Vehicle not found!");
  }
  const currentStatus = vehicle.status;
  if (
    (userIsGov &&
      currentStatus === VehicleStatus.SUBMITTED &&
      (status === VehicleStatus.REJECTED ||
        status === VehicleStatus.VALIDATED)) ||
    (!userIsGov &&
      currentStatus === VehicleStatus.REJECTED &&
      status === VehicleStatus.DELETED)
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });
      await createHistory(id, userId, status, comment, tx);
    });
    return getSuccessActionResponse();
  }
  return getErrorActionResponse("Invalid Action!");
};

export type AttachmentPayload = {
  fileName: string;
  url: string;
};

export const getAttachmentDownloadUrls = async (
  id: number,
): Promise<DataOrErrorActionResponse<AttachmentPayload[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.VehicleAttachmentWhereInput = { vehicleId: id };
  if (!userIsGov) {
    whereClause.vehicle = {
      organizationId: userOrgId,
    };
  }
  const attachments = await prisma.vehicleAttachment.findMany({
    where: whereClause,
    select: {
      filename: true,
      minioObjectName: true,
    },
  });
  if (attachments.length === 0) {
    return getErrorActionResponse("No attachments found!");
  }
  const result: AttachmentPayload[] = [];
  for (const attachment of attachments) {
    result.push({
      fileName: attachment.filename,
      url: await getPresignedGetObjectUrl(attachment.minioObjectName),
    });
  }
  return getDataActionResponse(result);
};
