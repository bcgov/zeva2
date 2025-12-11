import { prismaOld } from "@/lib/prismaOld";
import { CreditApplicationVinLegacy } from "../generated/client";
import { TransactionClient } from "@/types/prisma";

export const seedLegacyVins = async (tx: TransactionClient) => {
  const issuedVinRecords = await prismaOld.record_of_sale.findMany({
    where: {
      sales_submission: {
        is: {
          validation_status: "VALIDATED",
        },
      },
    },
    select: {
      vin: true,
    },
  });
  const legacyVinsToCreate: Omit<CreditApplicationVinLegacy, "id">[] = [];
  for (const record of issuedVinRecords) {
    const vin = record.vin;
    if (vin) {
      legacyVinsToCreate.push({ vin });
    }
  }
  await tx.creditApplicationVinLegacy.createMany({
    data: legacyVinsToCreate,
  });
};
