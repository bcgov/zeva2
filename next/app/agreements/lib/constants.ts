import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";

export type AgreementContentPayload = {
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  modelYear: ModelYear;
  numberOfUnits: string;
};

export type AgreementContentRecord = {
  vehicleClass?: VehicleClass;
  zevClass?: ZevClass;
  modelYear?: ModelYear;
  numberOfUnits: string;
};
