import { TransactionClient } from "@/types/prisma";
import { ModelYear } from "../generated/client";

export const seedComplianceRatios = async (tx: TransactionClient) => {
  // Seed compliance ratios based on BC ZEV Act regulations
  const complianceRatios = [
    { modelYear: ModelYear.MY_2019, complianceRatio: 0, zevClassA: 0 },
    { modelYear: ModelYear.MY_2020, complianceRatio: 9.5, zevClassA: 6 },
    { modelYear: ModelYear.MY_2021, complianceRatio: 12, zevClassA: 8 },
    { modelYear: ModelYear.MY_2022, complianceRatio: 14.5, zevClassA: 10 },
    { modelYear: ModelYear.MY_2023, complianceRatio: 17, zevClassA: 12 },
    { modelYear: ModelYear.MY_2024, complianceRatio: 19.5, zevClassA: 14 },
    { modelYear: ModelYear.MY_2025, complianceRatio: 22, zevClassA: 16 },
    { modelYear: ModelYear.MY_2026, complianceRatio: 26.3, zevClassA: 15.2 },
    { modelYear: ModelYear.MY_2027, complianceRatio: 42.6, zevClassA: 28.7 },
    { modelYear: ModelYear.MY_2028, complianceRatio: 58.9, zevClassA: 43.2 },
    { modelYear: ModelYear.MY_2029, complianceRatio: 74.8, zevClassA: 58 },
    { modelYear: ModelYear.MY_2030, complianceRatio: 91, zevClassA: 73.3 },
    { modelYear: ModelYear.MY_2031, complianceRatio: 93.2, zevClassA: 77.2 },
    { modelYear: ModelYear.MY_2032, complianceRatio: 95.2, zevClassA: 80.6 },
    { modelYear: ModelYear.MY_2033, complianceRatio: 97.2, zevClassA: 83.7 },
    { modelYear: ModelYear.MY_2034, complianceRatio: 99.3, zevClassA: 86.7 },
    { modelYear: ModelYear.MY_2035, complianceRatio: 100, zevClassA: 89.5 },
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
