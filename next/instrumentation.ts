import { prisma } from "./lib/prisma";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await prisma.$connect();
  }
}
