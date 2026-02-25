"use server";

import { Directory, getAttachmentPutData } from "@/app/lib/services/s3";
import {
  ErrorOrSuccessActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { validateDate } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addJobToIcbcQueue } from "@/app/lib/services/queue";
import { IcbcFileStatus } from "@/prisma/generated/enums";

export const getPutObjectData = async () => {
  const data = await getAttachmentPutData(Directory.Icbc, 1);
  return data[0];
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
