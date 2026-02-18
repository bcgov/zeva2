import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IcbcFileModel } from "@/prisma/generated/models";
import { getOrderByClause, getWhereClause } from "./utils";

export type IcbcFileSparse = Omit<IcbcFileModel, "name">;

export const getIcbcFiles = async (
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<[IcbcFileSparse[], number]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return [[], 0];
  }
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const where = getWhereClause(filters);
  const orderBy = getOrderByClause(sorts, true);
  return await prisma.$transaction([
    prisma.icbcFile.findMany({
      skip,
      take,
      where,
      omit: {
        name: true,
      },
      orderBy,
    }),
    prisma.icbcFile.count({
      where,
    }),
  ]);
};
