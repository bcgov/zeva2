import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";

export type SupplierClass =
  | "small volume supplier"
  | "medium volume supplier"
  | "large volume supplier";

export const unspecifiedComplianceRatios: Readonly<
  Partial<Record<VehicleClass, Partial<Record<ModelYear, string>>>>
> = {
  [VehicleClass.REPORTABLE]: {
    MY_2019: "0",
    MY_2020: "0.095",
    MY_2021: "0.12",
    MY_2022: "0.145",
    MY_2023: "0.17",
    MY_2024: "0.195",
    MY_2025: "0.22",
    MY_2026: "0.263",
    MY_2027: "0.426",
    MY_2028: "0.589",
    MY_2029: "0.748",
    MY_2030: "0.91",
    MY_2031: "0.932",
    MY_2032: "0.952",
    MY_2033: "0.972",
    MY_2034: "0.993",
    MY_2035: "1",
  },
};

export const specialComplianceRatios: Readonly<
  Partial<
    Record<
      VehicleClass,
      Partial<Record<ZevClass, Partial<Record<ModelYear, string>>>>
    >
  >
> = {
  [VehicleClass.REPORTABLE]: {
    [ZevClass.A]: {
      MY_2019: "0",
      MY_2020: "0.06",
      MY_2021: "0.08",
      MY_2022: "0.1",
      MY_2023: "0.12",
      MY_2024: "0.14",
      MY_2025: "0.16",
      MY_2026: "0.152",
      MY_2027: "0.287",
      MY_2028: "0.432",
      MY_2029: "0.58",
      MY_2030: "0.733",
      MY_2031: "0.772",
      MY_2032: "0.806",
      MY_2033: "0.837",
      MY_2034: "0.867",
      MY_2035: "0.895",
    },
  },
};
