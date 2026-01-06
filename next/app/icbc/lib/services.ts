import { prisma } from "@/lib/prisma";
import { IcbcFileStatus } from "@/prisma/generated/client";

export const getLatestSuccessfulFileTimestamp = async () => {
  const icbcFile = await prisma.icbcFile.findFirst({
    where: {
      status: IcbcFileStatus.SUCCESS,
    },
    orderBy: {
      timestamp: "desc",
    },
    select: {
      timestamp: true,
    },
  });
  if (icbcFile) {
    return icbcFile.timestamp;
  }
  return null;
};
