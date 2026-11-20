import { PrismaClient } from "@/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const sslEnabled =
  process.env.DATABASE_SSL_ENABLED === undefined
    ? process.env.NODE_ENV === "production"
    : process.env.DATABASE_SSL_ENABLED === "true";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
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
