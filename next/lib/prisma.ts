import { PrismaClient } from "@/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const getPrisma = () =>
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== "production" ? ["info", "query"] : ["info"],
  });

const globalForPrisma = global as unknown as {
  prismaClient: ReturnType<typeof getPrisma>;
};

export const prisma = globalForPrisma.prismaClient || getPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClient = prisma;
}
