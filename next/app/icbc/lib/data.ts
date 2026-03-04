import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IcbcFileModel } from "@/prisma/generated/models";

export type IcbcFileWithUserName = Omit<
  IcbcFileModel,
  "name" | "uploadedById"
> & { uploadedBy: { firstName: string; lastName: string } | null };

export const getIcbcFiles = async (): Promise<IcbcFileWithUserName[]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return [];
  }
  return await prisma.icbcFile.findMany({
    omit: {
      name: true,
      uploadedById: true,
    },
    include: {
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });
};
