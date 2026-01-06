import { prismaOld } from "@/lib/prismaOld";
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
  const vinsToReserve: { vin: string }[] = [];
  for (const record of issuedVinRecords) {
    const vin = record.vin;
    if (vin) {
      vinsToReserve.push({ vin });
    }
  }
  await tx.reservedVin.createMany({
    data: vinsToReserve,
  });
};
