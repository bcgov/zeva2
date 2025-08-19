import { PrismaClient } from "@/prisma/generated/client";
import { Prisma } from "@/prisma/generated/client";

const options: { log: Prisma.LogLevel[] } =
  process.env.NODE_ENV !== "production"
    ? { log: ["info", "query"] }
    : { log: ["info"] };

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient(options);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
