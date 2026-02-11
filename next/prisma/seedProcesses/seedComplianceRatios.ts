import { TransactionClient } from "@/types/prisma";
import { ModelYear } from "../generated/client";

export const seedComplianceRatios = async (tx: TransactionClient) => {
  // Seed compliance ratios based on BC ZEV Act regulations
  const complianceRatios = [
    { modelYear: ModelYear.MY_2024, complianceRatio: 26, zevClassA: 16 },
    { modelYear: ModelYear.MY_2025, complianceRatio: 34, zevClassA: 20 },
    { modelYear: ModelYear.MY_2026, complianceRatio: 42, zevClassA: 20 },
    { modelYear: ModelYear.MY_2027, complianceRatio: 50, zevClassA: 20 },
    { modelYear: ModelYear.MY_2028, complianceRatio: 58, zevClassA: 20 },
    { modelYear: ModelYear.MY_2029, complianceRatio: 66, zevClassA: 20 },
    { modelYear: ModelYear.MY_2030, complianceRatio: 74, zevClassA: 20 },
    { modelYear: ModelYear.MY_2031, complianceRatio: 82, zevClassA: 20 },
    { modelYear: ModelYear.MY_2032, complianceRatio: 90, zevClassA: 20 },
    { modelYear: ModelYear.MY_2033, complianceRatio: 100, zevClassA: 20 },
  ];

  for (const ratio of complianceRatios) {
    await tx.complianceRatio.upsert({
      where: {
        modelYear: ratio.modelYear,
      },
      update: {
        complianceRatio: ratio.complianceRatio,
        zevClassA: ratio.zevClassA,
      },
      create: {
        modelYear: ratio.modelYear,
        complianceRatio: ratio.complianceRatio,
        zevClassA: ratio.zevClassA,
      },
    });
  }

  console.log("Seeded compliance ratios");
};
