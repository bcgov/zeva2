"use server";

import {
  getObject,
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
  setObjectLegalHold,
} from "@/app/lib/minio";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreditApplicationStatus, Role } from "@/prisma/generated/client";
import { randomUUID } from "crypto";
import Excel from "exceljs";
import { Prisma } from "@/prisma/generated/client";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import {
  populateCurableVins,
  populateErrors,
  populateValidVins,
  validateSupplierSheet,
} from "./utils";
import {
  createTransactions,
  getCreditApplicationTemplate,
  getIcbcRecordsMap,
  getSupplierVehiclesMap,
  getSupplierVehiclesMapSparse,
  getSupplierVehiclesSparse,
  getVinRecordsMap,
  putWorkbook,
  updateVins,
} from "./services";
import {
  Directory,
  GovTemplateSheetNames,
  SupplierTemplateSheetNames,
  TemplateNames,
} from "./constants";
import { CreditsPayload } from "./components/ParsedApplication";

export const getSupplierTemplateDownloadUrl = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov) {
    const vehicles = await getSupplierVehiclesSparse(userOrgId);
    const template = await getCreditApplicationTemplate(
      TemplateNames.SupplierTemplate,
    );
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(template);
    const vehiclesSheet = workbook.getWorksheet(
      SupplierTemplateSheetNames.ValidVehicles,
    );
    if (vehiclesSheet) {
      const modelYearsMap = getModelYearEnumsToStringsMap();
      vehicles.forEach((vehicle) => {
        vehiclesSheet.addRow([
          vehicle.make,
          vehicle.modelName,
          modelYearsMap[vehicle.modelYear],
        ]);
      });
      return await putWorkbook(Directory.CreditApplicationTmp, workbook);
    }
  }
};

export const getCreditApplicationPutData = async () => {
  const objectName = Directory.CreditApplication + randomUUID();
  const url = await getPresignedPutObjectUrl(objectName);
  return {
    objectName,
    url,
  };
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
  const dataSheet = workbook.getWorksheet(
    SupplierTemplateSheetNames.ZEVsSupplied,
  );
  if (dataSheet) {
    const data = validateSupplierSheet(dataSheet);
    const vehiclesMap = await getSupplierVehiclesMapSparse(userOrgId);
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
          vehiclesMap[info.make]?.[info.modelName]?.[info.modelYear];
        if (vehicleId) {
          toInsert.push({
            vin,
            creditApplicationId: id,
            vehicleId,
            timestamp: info.timestamp,
          });
        } else {
          throw new Error(`No system vehicle found for VIN ${vin}!`);
        }
      }
      await tx.vinAssociatedWithCreditApplication.createMany({
        data: toInsert,
      });
      await setObjectLegalHold(objectName);
    });
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
    const creditApplication = await prisma.creditApplication.findUnique({
      where: {
        id: creditApplicationId,
      },
      select: {
        organizationId: true,
      },
    });
    if (!creditApplication) {
      throw new Error(`Credit Application ${creditApplicationId} not found!`);
    }
    const vinRecordsMap = await getVinRecordsMap(creditApplicationId);
    const vehiclesMap = await getSupplierVehiclesMap(
      creditApplication.organizationId,
    );
    const icbcMap = await getIcbcRecordsMap(Object.keys(vinRecordsMap));
    const template = await getCreditApplicationTemplate(
      TemplateNames.GovTemplate,
    );
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(template);
    const validSheet = workbook.getWorksheet(GovTemplateSheetNames.ValidVins);
    const curableSheet = workbook.getWorksheet(
      GovTemplateSheetNames.CurableVins,
    );
    const incurableSheet = workbook.getWorksheet(
      GovTemplateSheetNames.IncurableVins,
    );
    if (validSheet && curableSheet && incurableSheet) {
      populateErrors(vinRecordsMap, vehiclesMap, icbcMap);
      populateValidVins(validSheet, vinRecordsMap, vehiclesMap, icbcMap);
      populateCurableVins(curableSheet, vinRecordsMap, vehiclesMap, icbcMap);
    } else {
      throw new Error("Invalid Template");
    }
    return await putWorkbook(Directory.CreditApplicationTmp, workbook);
  }
};

export const analystRecommend = async (
  creditApplicationId: number,
  status: CreditApplicationStatus,
  fileId: string,
  fileName: string,
) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized");
  }
  if (
    status !== CreditApplicationStatus.RECOMMEND_APPROVAL &&
    status !== CreditApplicationStatus.RECOMMEND_REJECTION
  ) {
    throw new Error("Invalid Action");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
    },
  });
  if (
    !creditApplication ||
    (creditApplication.status !== CreditApplicationStatus.SUBMITTED &&
      creditApplication.status !== CreditApplicationStatus.RETURNED_TO_ANALYST)
  ) {
    throw new Error("Invalid Action");
  }

  await prisma.$transaction(async (tx) => {
    await tx.creditApplication.update({
      where: {
        id: creditApplicationId,
      },
      data: {
        status,
        govFileId: fileId,
        govFileName: fileName,
      },
    });
    await setObjectLegalHold(fileId);
  });
};

export const getGovFileDownloadInfo = async (
  creditApplicationId: number,
): Promise<{ url: string; fileName: string }> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
    },
    select: {
      govFileId: true,
      govFileName: true,
    },
  });
  if (
    !creditApplication ||
    !creditApplication.govFileId ||
    !creditApplication.govFileName
  ) {
    throw new Error("Not found!");
  }
  const url = await getPresignedGetObjectUrl(creditApplication.govFileId);
  return {
    url,
    fileName: creditApplication.govFileName,
  };
};

export const directorApprove = async (
  creditApplicationId: number,
  credits: CreditsPayload,
  approvedVins: string[],
) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.DIRECTOR)) {
    throw new Error("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      status: CreditApplicationStatus.RECOMMEND_APPROVAL,
    },
  });
  if (!creditApplication) {
    throw new Error("Invalid Action!");
  }
  const orgId = creditApplication.organizationId;
  await prisma.$transaction(async (tx) => {
    await tx.creditApplication.update({
      where: {
        id: creditApplicationId,
      },
      data: {
        status: CreditApplicationStatus.APPROVED,
      },
    });
    await updateVins(creditApplicationId, approvedVins, tx);
    await createTransactions(creditApplicationId, orgId, credits, tx);
  });
};
