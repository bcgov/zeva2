import { PrismaClient as PrismaClientOld } from "@/prisma/generated/clientOld";

const globalForPrisma = globalThis as unknown as { prismaOld: PrismaClientOld };

export const prismaOld = globalForPrisma.prismaOld || new PrismaClientOld();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaOld = prismaOld;
}
