import { PrismaClient as PrismaClient } from "@/prisma/generated/client";
import { Prisma } from "@/prisma/generated/client";

const options: { log: Prisma.LogLevel[] } =
  process.env.NODE_ENV !== "production"
    ? { log: ["info", "query"] }
    : { log: ["info"] };
const prisma = new PrismaClient(options);

const globalForPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
