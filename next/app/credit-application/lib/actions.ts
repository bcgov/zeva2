"use server";

import {
  getObject,
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
} from "@/app/lib/minio";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
  Role,
  TransactionType,
  Prisma,
  ReferenceType,
  Notification,
} from "@/prisma/generated/client";
import { randomUUID } from "crypto";
import Excel from "exceljs";
import {
  CreditApplicationCreditSerialized,
  getCreditApplicationFullObjectName,
  getSupplierVehiclesMap,
  getWarningsMap,
  parseSupplierSubmission,
} from "./utils";
import {
  createAttachments,
  createHistory,
  getEligibleVehicles,
  getIcbcRecordsMap,
  getReservedVins,
  getVinRecordsMap,
  unreserveVins,
  updateStatus,
} from "./services";
import { SupplierTemplate } from "./constants";
import { Directory } from "@/app/lib/constants/minio";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import {
  Attachment,
  AttachmentDownload,
  deleteAttachments,
} from "@/app/lib/services/attachments";
import { addJobToEmailQueue } from "@/app/lib/services/queue";

export const getSupplierTemplateDownloadUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${SupplierTemplate.Name}`,
  );
};

export const getSupplierEligibleVehicles = async () => {
  const { userOrgId } = await getUserInfo();
  return await getEligibleVehicles(userOrgId);
};

export const getCreditApplicationPutData = async (
  numberOfDocuments: number,
) => {
  const result: { objectName: string; url: string }[] = [];
  const { userOrgId } = await getUserInfo();
  for (let i = 0; i < numberOfDocuments; i++) {
    const objectName = randomUUID();
    const fullObjectName = getCreditApplicationFullObjectName(
      userOrgId,
      objectName,
    );
    result.push({
      objectName,
      url: await getPresignedPutObjectUrl(fullObjectName),
    });
  }
  return result;
};

// first attachment expected to be the credit application file;
// the rest are additional documents
export const processSupplierFile = async (
  attachments: Attachment[],
  comment?: string,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userOrgId, userId } = await getUserInfo();
  let result = NaN;
  try {
    const application = attachments.shift();
    if (!application) {
      throw new Error("Application not uploaded!");
    }
    const fullObjectName = getCreditApplicationFullObjectName(
      userOrgId,
      application.objectName,
    );
    const file = await getObject(fullObjectName);
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(file);
    const dataSheet = workbook.getWorksheet(
      SupplierTemplate.ZEVsSuppliedSheetName,
    );
    if (!dataSheet) {
      throw new Error("Expected sheet not found!");
    }
    const data = parseSupplierSubmission(dataSheet);
    const reservedVinObjs = await getReservedVins(Object.keys(data));
    if (reservedVinObjs.length > 0) {
      const reservedVins: string[] = [];
      reservedVinObjs.forEach((obj) => {
        reservedVins.push(obj.vin);
      });
      throw new Error(`Reserved VINs: ${reservedVins.join(", ")}`);
    }
    const vehicles = await getEligibleVehicles(userOrgId);
    const vehiclesMap = getSupplierVehiclesMap(vehicles);
    const toInsertPrelim: Omit<
      Prisma.CreditApplicationVinCreateManyInput,
      "creditApplicationId"
    >[] = [];
    const vinsMissingVehicles: string[] = [];
    Object.entries(data).forEach(([vin, info]) => {
      const vehicleId =
        vehiclesMap[info.make]?.[info.modelName]?.[info.modelYear];
      if (vehicleId) {
        toInsertPrelim.push({
          vin,
          vehicleId,
          timestamp: info.timestamp,
        });
      } else {
        vinsMissingVehicles.push(vin);
      }
    });
    if (vinsMissingVehicles.length > 0) {
      throw new Error(
        `System vehicles not found for the following VINs: ${vinsMissingVehicles.join(", ")}`,
      );
    }
    await prisma.$transaction(async (tx) => {
      const { id } = await tx.creditApplication.create({
        data: {
          organizationId: userOrgId,
          status: CreditApplicationStatus.SUBMITTED,
          supplierStatus: CreditApplicationSupplierStatus.SUBMITTED,
          supplierFileId: application.objectName,
          supplierFileName: application.fileName,
        },
        select: {
          id: true,
        },
      });
      result = id;
      const toInsert: Prisma.CreditApplicationVinCreateManyInput[] = [];
      toInsertPrelim.forEach((obj) => {
        toInsert.push({
          ...obj,
          creditApplicationId: id,
        });
      });
      await tx.creditApplicationVin.createMany({
        data: toInsert,
      });
      await createAttachments(id, attachments, tx);
      const historyId = await createHistory(
        userId,
        id,
        CreditApplicationStatus.SUBMITTED,
        comment,
        tx,
      );
      await addJobToEmailQueue({
        historyId,
        notificationType: Notification.CREDIT_APPLICATION,
      });
    });
  } catch (e) {
    await deleteAttachments(
      userOrgId,
      attachments,
      getCreditApplicationFullObjectName,
    );
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getDataActionResponse<number>(result);
};

export type FileInfo = {
  fileName: string;
  url: string;
};

export const validateCreditApplication = async (
  creditApplicationId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      OR: [
        { status: CreditApplicationStatus.SUBMITTED },
        { status: CreditApplicationStatus.RETURNED_TO_ANALYST },
      ],
    },
    select: {
      organizationId: true,
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Credit Application Not Found!");
  }
  const vinRecordsMap = await getVinRecordsMap(creditApplicationId);
  const icbcMap = await getIcbcRecordsMap(Object.keys(vinRecordsMap));
  const warningsMap = getWarningsMap(vinRecordsMap, icbcMap);
  const recordsToCreate: Prisma.CreditApplicationRecordCreateManyInput[] = [];
  Object.entries(vinRecordsMap).forEach(([vin, data]) => {
    let validated = true;
    if (warningsMap[vin]) {
      validated = false;
    }
    recordsToCreate.push({
      vin,
      creditApplicationId,
      timestamp: data.timestamp,
      make: data.vehicle.make,
      modelName: data.vehicle.modelName,
      modelYear: data.vehicle.modelYear,
      vehicleClass: data.vehicle.vehicleClass,
      zevClass: data.vehicle.zevClass,
      numberOfUnits: data.vehicle.numberOfUnits,
      icbcMake: icbcMap[vin]?.make,
      icbcModelName: icbcMap[vin]?.modelName,
      icbcModelYear: icbcMap[vin]?.modelYear,
      validated,
      warnings: warningsMap[vin],
    });
  });
  await prisma.$transaction([
    prisma.creditApplicationRecord.deleteMany({
      where: {
        creditApplicationId,
      },
    }),
    prisma.creditApplicationRecord.createMany({
      data: recordsToCreate,
    }),
  ]);
  return getSuccessActionResponse();
};

export type ValidatedMap = Record<number, boolean>;

export type ReasonsMap = Record<number, string | null>;

export const updateValidatedRecords = async (
  id: number,
  validatedMap: ValidatedMap,
  reasonsMap: ReasonsMap,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id,
    },
  });
  if (
    !creditApplication ||
    (creditApplication.status !== CreditApplicationStatus.SUBMITTED &&
      creditApplication.status !== CreditApplicationStatus.RETURNED_TO_ANALYST)
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  const ids = new Set<number>();
  Object.keys(validatedMap)
    .concat(Object.keys(reasonsMap))
    .forEach((id) => {
      const idInt = parseInt(id, 10);
      ids.add(idInt);
    });
  const records = await prisma.creditApplicationRecord.findMany({
    where: {
      id: {
        in: Array.from(ids),
      },
    },
  });
  const recordIds: number[] = [];
  records.forEach((record) => {
    const id = record.id;
    recordIds.push(id);
    record.validated = validatedMap[id];
    record.reason = reasonsMap[id];
  });
  await prisma.$transaction([
    prisma.creditApplicationRecord.deleteMany({
      where: {
        id: {
          in: recordIds,
        },
      },
    }),
    prisma.creditApplicationRecord.createMany({
      data: records,
    }),
  ]);
  return getSuccessActionResponse();
};

export const analystRecommend = async (
  creditApplicationId: number,
  status: CreditApplicationStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
  }
  if (
    status !== CreditApplicationStatus.RECOMMEND_APPROVAL &&
    status !== CreditApplicationStatus.RECOMMEND_REJECTION
  ) {
    return getErrorActionResponse("Invalid Action!");
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
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await updateStatus(creditApplicationId, status, tx);
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      status,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_APPLICATION,
    });
  });
  return getSuccessActionResponse();
};

export const returnToSupplier = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      status: {
        in: [
          CreditApplicationStatus.SUBMITTED,
          CreditApplicationStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.RETURNED_TO_SUPPLIER,
      tx,
    );
    await unreserveVins(creditApplicationId, undefined, tx);
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      CreditApplicationStatus.RETURNED_TO_SUPPLIER,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_APPLICATION,
    });
  });
  return getSuccessActionResponse();
};

export const returnToAnalyst = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      status: {
        in: [
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.RECOMMEND_REJECTION,
        ],
      },
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.RETURNED_TO_ANALYST,
      tx,
    );
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      CreditApplicationStatus.RETURNED_TO_ANALYST,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_APPLICATION,
    });
  });
  return getSuccessActionResponse();
};

export const directorApprove = async (
  creditApplicationId: number,
  credits: CreditApplicationCreditSerialized[],
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      status: CreditApplicationStatus.RECOMMEND_APPROVAL,
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  const orgId = creditApplication.organizationId;
  const invalidVinRecords = await prisma.creditApplicationRecord.findMany({
    where: {
      creditApplicationId,
      validated: false,
    },
    select: {
      vin: true,
    },
  });
  const invalidVins = invalidVinRecords.map((record) => {
    return record.vin;
  });
  const transactionsToCreate: Prisma.ZevUnitTransactionCreateManyInput[] = [];
  credits.forEach((credit) => {
    transactionsToCreate.push({
      organizationId: orgId,
      type: TransactionType.CREDIT,
      referenceType: ReferenceType.SUPPLY_CREDITS,
      referenceId: creditApplicationId,
      vehicleClass: credit.vehicleClass,
      zevClass: credit.zevClass,
      modelYear: credit.modelYear,
      numberOfUnits: credit.numberOfUnits,
    });
  });
  await prisma.$transaction(async (tx) => {
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.APPROVED,
      tx,
    );
    await unreserveVins(creditApplicationId, invalidVins, tx);
    await tx.zevUnitTransaction.createMany({
      data: transactionsToCreate,
    });
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      CreditApplicationStatus.APPROVED,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_APPLICATION,
    });
  });
  return getSuccessActionResponse();
};

export const directorReject = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      status: CreditApplicationStatus.RECOMMEND_REJECTION,
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.REJECTED,
      tx,
    );
    await unreserveVins(creditApplicationId, undefined, tx);
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      CreditApplicationStatus.REJECTED,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.CREDIT_APPLICATION,
    });
  });
  return getSuccessActionResponse();
};

export const getDownloadUrls = async (
  id: number,
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.CreditApplicationWhereUniqueInput = { id };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  const application = await prisma.creditApplication.findUnique({
    where: whereClause,
    select: {
      organizationId: true,
      supplierFileId: true,
      supplierFileName: true,
      CreditApplicationAttachment: {
        select: {
          fileName: true,
          objectName: true,
        },
      },
    },
  });
  if (!application) {
    return getErrorActionResponse("Credit Application not found!");
  }
  const result: AttachmentDownload[] = [];
  result.push({
    fileName: application.supplierFileName,
    url: await getPresignedGetObjectUrl(
      getCreditApplicationFullObjectName(
        application.organizationId,
        application.supplierFileId,
      ),
    ),
  });
  for (const attachment of application.CreditApplicationAttachment) {
    result.push({
      fileName: attachment.fileName,
      url: await getPresignedGetObjectUrl(
        getCreditApplicationFullObjectName(
          application.organizationId,
          attachment.objectName,
        ),
      ),
    });
  }
  return getDataActionResponse(result);
};
