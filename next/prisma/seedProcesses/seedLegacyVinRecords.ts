import { TransactionClient } from "@/types/prisma";
import { ModelYear, VehicleClass, ZevClass, ZevType } from "../generated/enums";
import { prismaOld } from "@/lib/prismaOld";
import { isZevClass, isZevType } from "@/app/lib/utils/typeGuards";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";

const getKey = (
  objectId: number,
  orgId: number,
  make: string,
  model: string,
  modelYear: ModelYear,
) => {
  const delimiter = "|";
  const key = `${orgId}${delimiter}${make.trim().toLowerCase()}${delimiter}${model.trim().toLowerCase()}${delimiter}${modelYear}`;
  let delimiterCount = 0;
  for (const l of key) {
    if (l === delimiter) {
      delimiterCount = delimiterCount + 1;
    }
  }
  if (delimiterCount !== 3) {
    throw new Error(
      `old object with id ${objectId} has an illegal character! See the stack trace for more details.`,
    );
  }
  return key;
};

export const seedLegacyVinRecords = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const oldVehicles = await prismaOld.vehicle.findMany({
    where: {
      validation_status: "VALIDATED",
    },
    select: {
      id: true,
      organization_id: true,
      make: true,
      model_name: true,
      model_year: {
        select: {
          id: true,
        },
      },
      credit_class_code: {
        select: {
          credit_class: true,
        },
      },
      vehicle_zev_type: {
        select: {
          vehicle_zev_code: true,
        },
      },
      range: true,
    },
  });

  const vehiclesMap: Partial<
    Record<string, { zevClass: ZevClass; zevType: ZevType; range: number }>
  > = {};
  for (const vehicle of oldVehicles) {
    const zevClass = vehicle.credit_class_code?.credit_class;
    const zevType = vehicle.vehicle_zev_type.vehicle_zev_code;
    const my = mapOfModelYearIdsToModelYearEnum[vehicle.model_year.id];
    if (!zevClass || !isZevClass(zevClass)) {
      throw new Error(
        `old vehicle with id ${vehicle.id} has an unknown zev class!`,
      );
    }
    if (!isZevType(zevType)) {
      throw new Error(
        `old vehicle with id ${vehicle.id} has an unknown zev type!`,
      );
    }
    if (!my) {
      throw new Error(
        `old vehicle with id ${vehicle.id} has an unknown model year!`,
      );
    }
    // use old orgId
    const key = getKey(
      vehicle.id,
      vehicle.organization_id,
      vehicle.make,
      vehicle.model_name,
      my,
    );
    vehiclesMap[key] = {
      zevClass,
      zevType,
      range: vehicle.range,
    };
  }

  const oldVinRecords = await prismaOld.sales_submission_content.findMany({
    select: {
      id: true,
      xls_vin: true,
      xls_make: true,
      xls_model: true,
      xls_model_year: true,
      xls_sale_date: true,
      sales_submission: {
        select: {
          organization_id: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const mapOfVinsToData: Record<
    string,
    {
      newOrgId: number;
      zevClass: ZevClass;
      make: string;
      model: string;
      modelYear: ModelYear;
      zevType: ZevType;
      range: number;
      date: Date;
    }
  > = {};
  for (const record of oldVinRecords) {
    const vin = record.xls_vin?.trim().toUpperCase();
    const xlsDate = record.xls_sale_date;
    const make = record.xls_make;
    const model = record.xls_model;
    const xlsModelYear = record.xls_model_year;
    const oldOrgId = record.sales_submission.organization_id;
    if (!vin || !xlsDate || !make || !model || !xlsModelYear) {
      continue;
    }
    if (vin.length !== 17) {
      continue;
    }
    const newOrgId = mapOfOldOrgIdsToNewOrgIds[oldOrgId];
    if (!newOrgId) {
      throw new Error(
        `old vin record with id ${record.id} has an unknown org id!`,
      );
    }
    const my = modelYearsMap[xlsModelYear.split(".")[0]];
    if (!my) {
      throw new Error(
        `old vin record with id ${record.id} has an unknown model year!`,
      );
    }
    const key = getKey(record.id, oldOrgId, make, model, my);
    const vehicle = vehiclesMap[key];
    if (!vehicle) {
      throw new Error(
        `old vin record with id ${record.id} cannot be associated with a vehicle!`,
      );
    }
    // xls dates are decimals; the integer part is the number of days past Jan.1st, 1900 GMT.
    // all our dates are such that the fractional part should be zero.
    const xlsDateAsInt = Number.parseInt(xlsDate, 10);
    if (Number.isNaN(xlsDateAsInt)) {
      throw new Error(
        `old vin record with id ${record.id} has an invalid date!`,
      );
    }
    // 25569 is the number of days between Jan.1, 1970, and Jan.1, 1900 (note that leap years have 366 days).
    // 24 * 60 * 60 * 1000 is the number of milliseconds per day
    const msSinceUnixEpoch = (xlsDateAsInt - 25569) * 24 * 60 * 60 * 1000;
    const prelimDate = new Date(msSinceUnixEpoch);
    const tzOffset = prelimDate.getTimezoneOffset() * 60 * 1000;
    const date = new Date(msSinceUnixEpoch + tzOffset);
    mapOfVinsToData[vin] = {
      newOrgId,
      zevClass: vehicle.zevClass,
      make,
      model,
      modelYear: my,
      zevType: vehicle.zevType,
      range: vehicle.range,
      date,
    };
  }

  for (const [vin, data] of Object.entries(mapOfVinsToData)) {
    await tx.legacyVinRecords.create({
      data: {
        organizationId: data.newOrgId,
        vin,
        timestamp: data.date,
        vehicleClass: VehicleClass.REPORTABLE,
        zevClass: data.zevClass,
        modelYear: data.modelYear,
        make: data.make,
        modelName: data.model,
        zevType: data.zevType,
        range: data.range,
      },
    });
  }
};
