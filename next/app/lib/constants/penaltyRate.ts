import { ModelYear } from "@/prisma/generated/client";

export const penaltyRates: Readonly<Partial<Record<ModelYear, string>>> = {
  MY_2019: "5000",
  MY_2020: "5000",
  MY_2021: "5000",
  MY_2022: "5000",
  MY_2023: "5000",
  MY_2024: "5000",
  MY_2025: "5000",
  MY_2026: "20000",
};
