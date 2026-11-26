import { TransactionClient } from "@/types/prisma";
import {
  ModelYear,
  VehicleClass,
  VehicleClassCode,
  VehicleStatus,
  ZevType,
  ZevClass,
} from "../generated/enums";
import { prismaOld } from "@/lib/prismaOld";
import { isZevType } from "@/app/lib/utils/typeGuards";
import { getStringsToVehicleClassCodeEnumsMap } from "@/app/lib/utils/enumMaps";
import { zevModelKeyDelimiter } from "@/app/zev-models/lib/constants";
import {
  getLegacyNumberOfUnits,
  getNumberOfUnits,
} from "@/app/zev-models/lib/utilsServer";
import Decimal from "decimal.js";

export const seedVehicles = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
  mapOfOldCreditClassIdsToZevClasses: Partial<Record<number, ZevClass>>,
) => {
  const classCodesMap = getStringsToVehicleClassCodeEnumsMap();
  const vClassIdToEnum: Record<number, VehicleClassCode> = {};
  for (const r of await prismaOld.vehicle_class_code.findMany()) {
    const classCodeEnum = classCodesMap[r.description];
    if (classCodeEnum) {
      vClassIdToEnum[r.id] = classCodeEnum;
    } else {
      throw new Error(`unknown vehicle class code with id ${r.id}`);
    }
  }
  const vZevIdToEnum: Record<number, ZevType> = {};
  for (const r of await prismaOld.vehicle_zev_type.findMany()) {
    const zevCode = r.vehicle_zev_code;
    if (isZevType(zevCode)) {
      vZevIdToEnum[r.id] = zevCode;
    } else {
      throw new Error(`unknown vehicle zev type with id ${r.id}`);
    }
  }

  const vehiclesToCreate: {
    legacyId: number;
    range: number;
    make: string;
    modelYear: ModelYear;
    status: VehicleStatus;
    modelName: string;
    legacyNumberOfUnits: Decimal;
    numberOfUnits: Decimal;
    zevType: ZevType;
    vehicleClassCode: VehicleClassCode;
    weight: number;
    organizationId: number;
    zevClass: ZevClass;
    us06RangeGte16: boolean;
    isActive: boolean;
    vehicleClass: VehicleClass;
  }[] = [];
  const vehiclesOld = await prismaOld.vehicle.findMany({
    where: {
      validation_status: "VALIDATED",
    },
  });
  for (const vehicleOld of vehiclesOld) {
    const modelYearEnum =
      mapOfModelYearIdsToModelYearEnum[vehicleOld.model_year_id];
    const orgNewId = mapOfOldOrgIdsToNewOrgIds[vehicleOld.organization_id];
    const zevTypeEnum = vZevIdToEnum[vehicleOld.vehicle_zev_type_id];
    const classEnum = vClassIdToEnum[vehicleOld.vehicle_class_code_id];
    const zevClassEnum = vehicleOld.credit_class_id
      ? mapOfOldCreditClassIdsToZevClasses[vehicleOld.credit_class_id]
      : undefined;
    const oldWeight = vehicleOld.weight_kg;
    if (vehicleOld.make.includes(zevModelKeyDelimiter)) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has an illegal make!",
      );
    }
    if (vehicleOld.model_name.includes(zevModelKeyDelimiter)) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has an illegal model name!",
      );
    }
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
    if (!oldWeight.isInteger()) {
      throw new Error(
        "vehicle with id " + vehicleOld.id + " has a non-integer weight!",
      );
    }
    const newWeight = oldWeight.toNumber();
    vehiclesToCreate.push({
      legacyId: vehicleOld.id,
      range: vehicleOld.range,
      make: vehicleOld.make.trim(),
      modelYear: modelYearEnum,
      status: VehicleStatus.VALIDATED,
      modelName: vehicleOld.model_name.trim(),
      legacyNumberOfUnits: getLegacyNumberOfUnits(
        zevClassEnum,
        vehicleOld.range,
        vehicleOld.has_passed_us_06_test,
      ),
      numberOfUnits: getNumberOfUnits(
        zevClassEnum,
        zevTypeEnum,
        modelYearEnum,
        vehicleOld.range,
      ),
      zevType: zevTypeEnum,
      vehicleClassCode: classEnum,
      weight: newWeight,
      organizationId: orgNewId,
      zevClass: zevClassEnum,
      us06RangeGte16: vehicleOld.has_passed_us_06_test,
      isActive: vehicleOld.is_active,
      vehicleClass: VehicleClass.REPORTABLE,
    });
  }

  await tx.vehicle.createMany({
    data: vehiclesToCreate,
  });
};
