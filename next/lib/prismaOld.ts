import { PrismaClient } from "@/prismaOld/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_OLD,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

const getPrisma = () =>
  new PrismaClient({
    adapter,
  });

const globalForPrismaOld = global as unknown as {
  prismaClientOld: ReturnType<typeof getPrisma>;
};

export const prismaOld = globalForPrismaOld.prismaClientOld || getPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaOld.prismaClientOld = prismaOld;
}
