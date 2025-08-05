import { VehicleClass, ZevClass, ModelYear } from "@/prisma/generated/client";

export const vehicleClasses: readonly VehicleClass[] =
  Object.values(VehicleClass);

export const zevClasses: readonly ZevClass[] = Object.values(ZevClass);

export const modelYears: readonly ModelYear[] = Object.values(ModelYear);

export const specialZevClasses: readonly ZevClass[] = [ZevClass.A];

export const otherZevClasses: readonly ZevClass[] = Array.from(
  new Set(zevClasses).difference(
    new Set(specialZevClasses.concat([ZevClass.UNSPECIFIED])),
  ),
);
