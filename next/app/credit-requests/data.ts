import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/client";

export async function fetchUnitTransactions() {
  let result;
  const session = await auth();
  const isGov = session?.user?.isGovernment;
  const organizationId = session?.user?.organizationId;
  if (isGov) {
    result = await prisma.zevUnitTransaction.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
  } else {
    result = await prisma.zevUnitTransaction.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
  }
  return result;
}
