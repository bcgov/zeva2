import { VehicleClass, ZevClass, ModelYear } from "@/prisma/generated/client";

export const vehicleClasses = Object.values(VehicleClass).map(
  (key) => VehicleClass[key],
);

export const zevClasses = Object.values(ZevClass).map((key) => ZevClass[key]);

export const modelYears = Object.values(ModelYear).map((key) => ModelYear[key]);

export const specialZevClasses = [ZevClass.A];

export const otherZevClasses = Array.from(
  new Set(zevClasses).difference(
    new Set((specialZevClasses as ZevClass[]).concat([ZevClass.UNSPECIFIED])),
  ),
);
