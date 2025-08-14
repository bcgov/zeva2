import { TransactionClient } from "@/types/prisma";
import {
  ModelYear,
  VehicleClass,
  VehicleClassCode,
  VehicleStatus,
  VehicleZevType,
  ZevClass,
} from "../generated/client";
import { prismaOld } from "@/lib/prismaOld";

export const seedVehicles = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
  mapOfOldCreditClassIdsToZevClasses: Partial<Record<number, ZevClass>>,
) => {
  const vClassIdToEnum: Record<number, VehicleClassCode> = {};
  for (const r of await prismaOld.vehicle_class_code.findMany()) {
    vClassIdToEnum[r.id] = r.vehicle_class_code as VehicleClassCode;
  }
  const vZevIdToEnum: Record<number, VehicleZevType> = {};
  for (const r of await prismaOld.vehicle_zev_type.findMany()) {
    vZevIdToEnum[r.id] = r.vehicle_zev_code as VehicleZevType;
  }
  const vehiclesOld = await prismaOld.vehicle.findMany({
    where: {
      validation_status: "VALIDATED",
    },
  });
  for (const vehicleOld of vehiclesOld) {
    const modelYearEnum =
      mapOfModelYearIdsToModelYearEnum[vehicleOld.model_year_id];
    const orgNewId = mapOfOldOrgIdsToNewOrgIds[vehicleOld.organization_id];
    const zevEnum = vZevIdToEnum[vehicleOld.vehicle_zev_type_id];
    const classEnum = vClassIdToEnum[vehicleOld.vehicle_class_code_id];
    const zevClassEnum = vehicleOld.credit_class_id
      ? mapOfOldCreditClassIdsToZevClasses[vehicleOld.credit_class_id]
      : undefined;
    const numberOfUnits = vehicleOld.credit_value;
    const oldWeight = vehicleOld.weight_kg;
    if (!modelYearEnum) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has unknown model year!",
      );
    }
    if (orgNewId === undefined) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has unknown orgId",
      );
    }
    if (!zevClassEnum) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has no zev class!",
      );
    }
    if (!numberOfUnits) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has no credit value!",
      );
    }
    if (!oldWeight.isInteger()) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has a non-integer weight!",
      );
    }
    const newWeight = oldWeight.toNumber();

    await tx.vehicle.create({
      select: { id: true },
      data: {
        legacyId: vehicleOld.id,
        range: vehicleOld.range,
        make: vehicleOld.make,
        modelYear: modelYearEnum,
        status: VehicleStatus.VALIDATED,
        modelName: vehicleOld.model_name,
        numberOfUnits,
        vehicleZevType: zevEnum,
        vehicleClassCode: classEnum,
        weight: newWeight,
        organizationId: orgNewId,
        zevClass: zevClassEnum,
        us06RangeGte16: vehicleOld.has_passed_us_06_test,
        isActive: vehicleOld.is_active,
        vehicleClass: VehicleClass.REPORTABLE,
      },
    });
  }
};
