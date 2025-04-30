import { getPresignedPutObjectUrl } from "@/app/lib/minio";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addJobToIcbcQueue } from "@/lib/utils/queue";
import { IcbcFile } from "@/prisma/generated/client";
import { randomUUID } from "crypto";

export const getPutObjectData = async (): Promise<
  { objectName: string; url: string } | undefined
> => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    const objectName = randomUUID();
    const url = await getPresignedPutObjectUrl(objectName);
    return {
      objectName,
      url,
    };
  }
};

export const createIcbcFile = async (data: Omit<IcbcFile, "id">) => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    await prisma.$transaction(async (tx) => {
      const icbcFile = await tx.icbcFile.create({
        data,
      });
      await addJobToIcbcQueue(icbcFile.id);
    });
  }
};
