"use server"

import {
  getObject,
  getPresignedGetObjectUrl,
  putObject,
  Directory,
  getPresignedPutObjectUrl,
  setObjectLegalHold,
} from "@/app/lib/minio";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  ModelYear,
  Role,
  VehicleStatus,
} from "@/prisma/generated/client";
import { randomUUID } from "crypto";
import Excel from "exceljs";
import { createReadStream } from "fs";
import { Prisma } from "@/prisma/generated/client";
import {
  getModelYearEnumsToStringsMap,
  getStringsToModelYearsEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { getHeadersMap } from "./utils";

export const getSupplierTemplateDownloadUrl = async () => {
  const templateName = "credit_application_supplier_template.xlsx";
  const generatedTemplateName = Directory.CreditApplicationTmp + randomUUID();
  const { userOrgId } = await getUserInfo();
  let template;
  // there may be cwd/path differences/issues after the app is built/deployed,
  // so, in that case, we get the template from object storage
  if (process.env.NODE_ENV === "production") {
    template = await getObject(Directory.Templates + templateName);
  } else {
    template = createReadStream(
      "app/credit-application/lib/templates/" + templateName,
    );
  }
  const vehicles = await prisma.vehicle.findMany({
    where: {
      organizationId: userOrgId,
      status: VehicleStatus.VALIDATED,
      vehicleClass: {
        not: null
      },
      zevClass: {
        not: null
      },
      creditValue: {
        not: null,
      },
      isActive: true,
    },
    select: {
      make: true,
      modelName: true,
      modelYear: true,
    },
  });
  const workbook = new Excel.Workbook();
  await workbook.xlsx.read(template);
  const vehiclesSheet = workbook.getWorksheet("Valid Vehicles");
  if (vehiclesSheet) {
    const modelYearsMap = getModelYearEnumsToStringsMap();
    vehicles.forEach((vehicle) => {
      vehiclesSheet.addRow([
        vehicle.make,
        vehicle.modelName,
        modelYearsMap[vehicle.modelYear],
      ]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    // use ts-ignore below; the return type of writeBuffer() is mis-typed;
    // see: https://github.com/exceljs/exceljs/issues/1032
    // @ts-ignore
    await putObject(generatedTemplateName, buffer);
    return await getPresignedGetObjectUrl(generatedTemplateName);
  }
};

export const getSupplierPutData = async () => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    const objectName = Directory.CreditApplication + randomUUID();
    const url = await getPresignedPutObjectUrl(objectName);
    return {
      objectName,
      url,
    };
  }
};

export const processSupplierFile = async (
  objectName: string,
  fileName: string,
) => {
  // create vins, credit application record, legal hold on file.
  let result = -1;
  const { userOrgId } = await getUserInfo();
  const file = await getObject(objectName);
  const workbook = new Excel.Workbook();
  await workbook.xlsx.read(file);
  const dataSheet = workbook.getWorksheet("ZEVs Supplied");
  if (dataSheet) {
    const rowCount = dataSheet.rowCount;
    if (rowCount >= 2 && rowCount <= 2001) {
      const data: Record<
        string,
        {
          make: string;
          modelName: string;
          modelYear: ModelYear;
          timestamp: Date;
        }
      > = {};
      const headersMap = getHeadersMap(dataSheet.getRow(1), true);
      const modelYearsMap = getStringsToModelYearsEnumsMap();
      dataSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          let vin: string | undefined;
          let make: string | undefined;
          let modelName: string | undefined;
          let modelYear: ModelYear | undefined;
          let timestamp: Date | undefined;
          row.eachCell((cell) => {
            const col = cell.col;
            const header = headersMap[col];
            if (header) {
              const value = cell.value?.toString();
              if (value) {
                if (header === "VIN") {
                  vin = value;
                } else if (header === "Make") {
                  make = value;
                } else if (header === "Model Name") {
                  modelName = value;
                } else if (header === "Model Year") {
                  const year = modelYearsMap[value];
                  if (year) {
                    modelYear = year;
                  }
                } else if (header === "Date (YYYY-MM-DD)") {
                  timestamp = new Date(value);
                }
              }
            }
          });
          if (vin && make && modelName && modelYear && timestamp) {
            data[vin] = {
              make,
              modelName,
              modelYear,
              timestamp,
            };
          }
        }
      });
      const vehicleOrClause: Prisma.VehicleWhereInput[] = [];
      for (const vehicle of Object.values(data)) {
        vehicleOrClause.push({
          make: vehicle.make,
          modelName: vehicle.modelName,
          modelYear: vehicle.modelYear,
        });
      }
      const sysVehicles = await prisma.vehicle.findMany({
        where: {
          organizationId: userOrgId,
          status: VehicleStatus.VALIDATED,
          creditValue: {
            not: null,
          },
          vehicleClass: {
            not: null
          },
          zevClass: {
            not: null
          },
          isActive: true,
          OR: vehicleOrClause,
        },
        select: {
          id: true,
          make: true,
          modelName: true,
          modelYear: true,
        },
      });
      const sysVehiclesMap: Record<
        string,
        Record<string, Partial<Record<ModelYear, number>>>
      > = {};
      for (const vehicle of sysVehicles) {
        const make = vehicle.make;
        const modelName = vehicle.modelName;
        const modelYear = vehicle.modelYear;
        if (!sysVehiclesMap[make]) {
          sysVehiclesMap[make] = {};
        }
        if (!sysVehiclesMap[make][modelName]) {
          sysVehiclesMap[make][modelName] = {};
        }
        sysVehiclesMap[make][modelName][modelYear] = vehicle.id;
      }
      await prisma.$transaction(async (tx) => {
        const { id } = await tx.creditApplication.create({
          data: {
            organizationId: userOrgId,
            status: CreditApplicationStatus.SUBMITTED,
            supplierFileId: objectName,
            supplierFileName: fileName,
          },
          select: {
            id: true,
          },
        });
        result = id;
        const toInsert: Prisma.VinAssociatedWithCreditApplicationCreateManyInput[] =
          [];
        for (const [vin, info] of Object.entries(data)) {
          const vehicleId =
            sysVehiclesMap[info.make]?.[info.modelName]?.[info.modelYear];
          if (vehicleId) {
            toInsert.push({
              vin,
              creditApplicationId: id,
              vehicleId,
              timestamp: info.timestamp,
            });
          } else {
            throw new Error(`No system vehicle found for VIN ${vin}!`)
          }
        }
        await tx.vinAssociatedWithCreditApplication.createMany({
          data: toInsert,
        });
        await setObjectLegalHold(objectName);
      });
    }
  }
  return result;
};

export const getSupplierFileInfo = async (
  creditApplicationId: number,
): Promise<{ fileName: string; url: string } | undefined> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  if (!userIsGov) {
    whereClause = { ...whereClause, organizationId: userOrgId };
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: whereClause,
  });
  if (creditApplication) {
    const url = await getPresignedGetObjectUrl(
      creditApplication.supplierFileId,
    );
    return {
      fileName: creditApplication.supplierFileName,
      url,
    };
  }
};

// should be okay memory-wise, because of the upper bound on the number of records in a credit application...
export const validateCreditApplication = async (
  creditApplicationId: number,
) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (userIsGov && userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    const records = await prisma.vinAssociatedWithCreditApplication.findMany({
      where: {
        creditApplication: {
          id: creditApplicationId,
          OR: [
            { status: CreditApplicationStatus.SUBMITTED },
            { status: CreditApplicationStatus.RETURNED_TO_ANALYST },
          ],
        },
      },
      select: {
        vin: true,
        timestamp: true,
        vehicle: {
          select: {
            make: true,
            modelName: true,
            modelYear: true,
            vehicleClass: true,
            zevClass: true,
            creditValue: true,
          },
        },
      },
    });
    const recordsMap: {
      [key: string]: {
        make: string;
        model: string;
        year: ModelYear;
        credits: string;
      };
    } = {};
    for (const record of records) {
      recordsMap[record.vin] = {
        make: record.vehicle.make,
        model: record.vehicle.modelName,
        year: record.vehicle.modelYear,
        credits: record.vehicle.creditValue
          ? record.vehicle.creditValue.toString()
          : "",
      };
    }
    const icbcRecords = await prisma.icbcRecord.findMany({
      where: {
        vin: {
          in: Object.keys(recordsMap),
        },
      },
      select: {
        vin: true,
        make: true,
        model: true,
        year: true,
        icbcFile: {
          select: {
            timestamp: true,
          },
        },
      },
    });
    const icbcMap: {
      [key: string]: {
        make: string;
        model: string;
        year: ModelYear;
        timestamp: Date;
      };
    } = {};
    for (const icbcRecord of icbcRecords) {
      icbcMap[icbcRecord.vin] = {
        make: icbcRecord.make,
        model: icbcRecord.model,
        year: icbcRecord.year,
        timestamp: icbcRecord.icbcFile.timestamp,
      };
    }
    const validRecords: any[][] = [];
    const invalidRecords: any[][] = [];
    const modelYearsMap = getModelYearEnumsToStringsMap();
    for (const [vin, data] of Object.entries(recordsMap)) {
      const make = data.make;
      const model = data.model;
      const year = data.year;
      const credits = data.credits;
      const associatedIcbcRecord = icbcMap[vin];
      if (associatedIcbcRecord) {
        const icbcMake = associatedIcbcRecord.make;
        const icbcModel = associatedIcbcRecord.model;
        const icbcYear = associatedIcbcRecord.year;
        const icbcTimestamp = associatedIcbcRecord.timestamp;
        const errors: string[] = [];
        if (make !== icbcMake) {
          errors.push("mismatched make");
        }
        if (year !== icbcYear) {
          errors.push("mismatched year");
        }
        if (errors.length > 0) {
          invalidRecords.push([
            vin,
            make,
            model,
            modelYearsMap[year],
            icbcMake,
            icbcModel,
            modelYearsMap[icbcYear],
            icbcTimestamp,
            errors.join(", "),
          ]);
        } else {
          validRecords.push([
            vin,
            make,
            model,
            modelYearsMap[year],
            icbcMake,
            icbcModel,
            modelYearsMap[icbcYear],
            icbcTimestamp,
            credits,
          ]);
        }
      } else {
        invalidRecords.push([
          vin,
          make,
          model,
          modelYearsMap[year],
          ,
          ,
          ,
          ,
          "no icbc record found",
        ]);
      }
    }
    const templateName = "credit_application_gov_template.xlsx";
    const generatedTemplateName = Directory.CreditApplicationTmp + randomUUID();
    let template;
    // there may be cwd/path differences/issues after the app is built/deployed,
    // so, in that case, we get the template from object storage
    if (process.env.NODE_ENV === "production") {
      template = await getObject(Directory.Templates + templateName);
    } else {
      template = createReadStream(
        "app/credit-application/lib/templates/" + templateName,
      );
    }
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(template);
    const validSheet = workbook.getWorksheet("Valid");
    if (validSheet) {
      validRecords.forEach((record) => [validSheet.addRow(record)]);
    }
    const invalidSheet = workbook.getWorksheet("Invalid");
    if (invalidSheet) {
      invalidRecords.forEach((record) => [invalidSheet.addRow(record)]);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    // use ts-ignore below; the return type of writeBuffer() is mis-typed;
    // see: https://github.com/exceljs/exceljs/issues/1032
    // @ts-ignore
    await putObject(generatedTemplateName, buffer);
    return await getPresignedGetObjectUrl(generatedTemplateName);
  }
};
