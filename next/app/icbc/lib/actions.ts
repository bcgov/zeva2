"use server";

import { getPresignedPutObjectUrl } from "@/app/lib/minio";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { validateDate } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addJobToIcbcQueue } from "@/app/lib/services/queue";
import { IcbcFileStatus } from "@/prisma/generated/client";
import { randomUUID } from "crypto";
import { getIcbcFileFullObjectName } from "./utils";

export type PutData = {
  objectName: string;
  url: string;
};

export const getPutObjectData = async (): Promise<
  DataOrErrorActionResponse<PutData>
> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const objectName = randomUUID();
  const url = await getPresignedPutObjectUrl(
    getIcbcFileFullObjectName(objectName),
  );
  return getDataActionResponse<PutData>({
    objectName,
    url,
  });
};

export type CreateIcbcFileData = {
  icbcFileId: number;
};

export const createIcbcFile = async (
  objectName: string,
  datestring: string,
): Promise<DataOrErrorActionResponse<CreateIcbcFileData>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const [isValidDate, date] = validateDate(datestring);
  if (!isValidDate) {
    return getErrorActionResponse("Invalid Date!");
  }
    const icbcFile = await prisma.icbcFile.create({
    data: {
      name: objectName,
      status: IcbcFileStatus.PROCESSING,
      timestamp: date,
    },
  });
  
  await addJobToIcbcQueue(icbcFile.id);
  
  return getDataActionResponse<CreateIcbcFileData>({ icbcFileId: icbcFile.id });
};

export type IcbcFileStatusData = {
  status: IcbcFileStatus;
  timestamp: Date;
};

export const getIcbcFileStatus = async (
  icbcFileId: number,
): Promise<DataOrErrorActionResponse<IcbcFileStatusData>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const icbcFile = await prisma.icbcFile.findUnique({
    where: { id: icbcFileId },
    select: { status: true, timestamp: true },
  });
  if (!icbcFile) {
    return getErrorActionResponse("ICBC file not found");
  }
  return getDataActionResponse<IcbcFileStatusData>({
    status: icbcFile.status,
    timestamp: icbcFile.timestamp,
  });
};

export type MostRecentUploadData = {
  timestamp: Date | null;
};

export const getMostRecentSuccessfulUpload = async (): Promise<
  DataOrErrorActionResponse<MostRecentUploadData>
> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const mostRecentFile = await prisma.icbcFile.findFirst({
    where: { status: IcbcFileStatus.SUCCESS },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  return getDataActionResponse<MostRecentUploadData>({
    timestamp: mostRecentFile?.timestamp ?? null,
  });
};
