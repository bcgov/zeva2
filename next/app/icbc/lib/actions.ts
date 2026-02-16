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
import { IcbcFileStatus } from "@/prisma/generated/enums";
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

export const createIcbcFile = async (
  objectName: string,
  datestring: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const [isValidDate, date] = validateDate(datestring);
  if (!isValidDate) {
    return getErrorActionResponse("Invalid Date!");
  }
  await prisma.$transaction(async (tx) => {
    const icbcFile = await tx.icbcFile.create({
      data: {
        name: objectName,
        status: IcbcFileStatus.PROCESSING,
        timestamp: date,
      },
    });
    await addJobToIcbcQueue(icbcFile.id);
  });
  return getSuccessActionResponse();
};
