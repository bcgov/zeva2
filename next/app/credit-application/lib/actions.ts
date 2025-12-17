"use server";

import {
  getObject,
  getPresignedGetObjectUrl,
  putObject,
} from "@/app/lib/minio";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditApplicationStatus,
  Role,
  TransactionType,
  Prisma,
  ReferenceType,
  Notification,
  ModelYear,
} from "@/prisma/generated/client";
import Excel from "exceljs";
import {
  CreditApplicationCreditSerialized,
  getApplicationFullObjectName,
  getWarningsMap,
  parseSupplierSubmission,
} from "./utils";
import {
  createHistory,
  getEligibleVehicles,
  getEligibleVehiclesMap,
  getIcbcRecordsMap,
  getReservedVins,
  unreserveVins,
  updateStatus,
  uploadAttachments,
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
import { AttachmentDownload, CaFile } from "@/app/lib/services/attachments";
import { addJobToEmailQueue } from "@/app/lib/services/queue";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import {
  getComplianceDate,
  getCompliancePeriod,
  getComplianceYear,
} from "@/app/lib/utils/complianceYear";

export const getSupplierTemplateDownloadUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${SupplierTemplate.Name}`,
  );
};

export const getSupplierEligibleVehicles = async () => {
  const { userOrgId } = await getUserInfo();
  return await getEligibleVehicles(userOrgId, false);
};

export const getApplicationDownloadUrl = async (
  creditApplicationId: number,
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const application = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      organizationId: userOrgId,
      status: {
        not: CreditApplicationStatus.DELETED,
      },
    },
    select: {
      objectName: true,
      fileName: true,
    },
  });
  if (!application) {
    return getErrorActionResponse("Invalid Action!");
  }
  const url = await getPresignedGetObjectUrl(application.objectName);
  return getDataActionResponse([
    {
      url,
      fileName: application.fileName,
    },
  ]);
};

export const getAttachmentDownloadUrls = async (
  creditApplicationId: number,
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  const result: AttachmentDownload[] = [];
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  if (userIsGov) {
    whereClause.status = {
      notIn: [CreditApplicationStatus.DELETED, CreditApplicationStatus.DRAFT],
    };
  }
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = {
      not: CreditApplicationStatus.DELETED,
    };
  }
  const application = await prisma.creditApplication.findUnique({
    where: whereClause,
    select: {
      CreditApplicationAttachment: {
        select: {
          objectName: true,
          fileName: true,
        },
      },
    },
  });
  if (!application) {
    return getErrorActionResponse("Invalid Action!");
  }
  for (const attachment of application.CreditApplicationAttachment) {
    result.push({
      url: await getPresignedGetObjectUrl(attachment.objectName),
      fileName: attachment.fileName,
    });
  }
  return getDataActionResponse(result);
};

export const supplierSave = async (
  application: CaFile,
  attachments: CaFile[],
  creditApplicationId?: number,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  if (userIsGov || !userRoles.includes(Role.ZEVA_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const oldAttachmentIds: number[] = [];
  if (creditApplicationId) {
    const creditApplication = await prisma.creditApplication.findUnique({
      where: {
        id: creditApplicationId,
        organizationId: userOrgId,
        status: CreditApplicationStatus.DRAFT,
      },
      select: {
        CreditApplicationAttachment: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!creditApplication) {
      return getErrorActionResponse("Invalid Action!");
    }
    for (const oldAttachment of creditApplication.CreditApplicationAttachment) {
      oldAttachmentIds.push(oldAttachment.id);
    }
  }
  const applicationObject = Buffer.from(application.data, "base64");
  const applicationObjectName =
    getApplicationFullObjectName("creditApplication");
  let applicationId: number = NaN;
  await prisma.$transaction(async (tx) => {
    if (creditApplicationId) {
      applicationId = creditApplicationId;
      await tx.creditApplication.update({
        where: {
          id: creditApplicationId,
        },
        data: {
          objectName: applicationObjectName,
          fileName: application.fileName,
        },
      });
    } else {
      const { id } = await tx.creditApplication.create({
        data: {
          organizationId: userOrgId,
          status: CreditApplicationStatus.DRAFT,
          supplierStatus: CreditApplicationStatus.DRAFT,
          objectName: applicationObjectName,
          fileName: application.fileName,
        },
      });
      applicationId = id;
    }
    await putObject(applicationObjectName, applicationObject);
    await tx.creditApplicationAttachment.deleteMany({
      where: {
        id: {
          in: oldAttachmentIds,
        },
      },
    });
    await uploadAttachments(applicationId, attachments, tx);
  });
  return getDataActionResponse(applicationId);
};

export const supplierDelete = async (
  creditApplicationId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  if (userIsGov || !userRoles.includes(Role.ZEVA_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      organizationId: userOrgId,
      status: CreditApplicationStatus.DRAFT,
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  await updateStatus(creditApplicationId, CreditApplicationStatus.DELETED);
  return getSuccessActionResponse();
};

export const supplierSubmit = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId, userId, userRoles } = await getUserInfo();
  if (userIsGov || !userRoles.includes(Role.SIGNING_AUTHORITY)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const application = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      organizationId: userOrgId,
      status: CreditApplicationStatus.DRAFT,
    },
    select: {
      objectName: true,
    },
  });
  if (!application) {
    return getErrorActionResponse("Invalid Action!");
  }
  const applicationFile = await getObject(application.objectName);
  const applicationBuf = await getArrayBuffer(applicationFile);
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(applicationBuf);
  try {
    const dataSheet = workbook.getWorksheet(
      SupplierTemplate.ZEVsSuppliedSheetName,
    );
    if (!dataSheet) {
      throw new Error("Expected sheet not found!");
    }
    const data = parseSupplierSubmission(dataSheet);
    const reservedVins = await getReservedVins(Object.keys(data));
    if (reservedVins.length > 0) {
      throw new Error(`Reserved VINs: ${reservedVins.join(", ")}`);
    }
    const vehiclesMap = await getEligibleVehiclesMap(userOrgId);
    const vinsMissingVehicles: string[] = [];
    const vinsToReserve: Prisma.ReservedVinCreateManyInput[] = [];
    const recordsToCreate: Prisma.CreditApplicationRecordCreateManyInput[] = [];
    const modelYears: Set<ModelYear> = new Set();
    for (const [vin, info] of Object.entries(data)) {
      const vehicleInfo =
        vehiclesMap[info.make]?.[info.modelName]?.[info.modelYear];
      if (!vehicleInfo) {
        vinsMissingVehicles.push(vin);
      } else {
        vinsToReserve.push({ vin });
        recordsToCreate.push({
          vin,
          creditApplicationId,
          make: info.make,
          modelName: info.modelName,
          modelYear: info.modelYear,
          timestamp: info.timestamp,
          vehicleClass: vehicleInfo[0],
          zevClass: vehicleInfo[1],
          numberOfUnits: vehicleInfo[2],
          validated: false,
        });
        modelYears.add(info.modelYear);
      }
    }
    if (vinsMissingVehicles.length > 0) {
      throw new Error(
        `System vehicles not found for the following VINs: ${vinsMissingVehicles.join(", ")}`,
      );
    }
    await prisma.$transaction(async (tx) => {
      await tx.creditApplication.update({
        where: {
          id: creditApplicationId,
        },
        data: {
          status: CreditApplicationStatus.SUBMITTED,
          supplierStatus: CreditApplicationStatus.SUBMITTED,
          submissionTimestamp: new Date(),
          modelYears: Array.from(modelYears),
        },
      });
      await tx.reservedVin.createMany({
        data: vinsToReserve,
      });
      await tx.creditApplicationRecord.createMany({
        data: recordsToCreate,
      });
      const historyId = await createHistory(
        userId,
        creditApplicationId,
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
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
  }
  return getSuccessActionResponse();
};

export const validateCreditApplication = async (
  creditApplicationId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const records = await prisma.creditApplicationRecord.findMany({
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
      id: true,
      vin: true,
      make: true,
      modelName: true,
      modelYear: true,
    },
  });
  const vins = records.reduce((acc: string[], cv) => {
    return [...acc, cv.vin];
  }, []);
  const icbcMap = await getIcbcRecordsMap(vins);
  const warningsMap = getWarningsMap(records, icbcMap);
  // at most 2000 update queries; hopefully this doesn't have a noticeable impact on performance!
  await prisma.$transaction(async (tx) => {
    for (const record of records) {
      const id = record.id;
      const vin = record.vin;
      let validated = true;
      const warnings = warningsMap[vin];
      if (warnings) {
        validated = false;
      }
      await tx.creditApplicationRecord.update({
        where: {
          id,
        },
        data: {
          icbcMake: icbcMap[vin]?.make,
          icbcModelName: icbcMap[vin]?.modelName,
          icbcModelYear: icbcMap[vin]?.modelYear,
          validated,
          warnings,
        },
      });
    }
  });
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
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
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
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.RECOMMEND_APPROVAL,
      tx,
    );
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      CreditApplicationStatus.RECOMMEND_APPROVAL,
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

export const analystReject = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
    return getErrorActionResponse("Unauthorized!");
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
    select: {
      CreditApplicationRecord: {
        select: {
          vin: true,
        },
      },
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  const vinsToUnreserve = creditApplication.CreditApplicationRecord.reduce(
    (acc: string[], cv) => {
      return [...acc, cv.vin];
    },
    [],
  );
  await prisma.$transaction(async (tx) => {
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.REJECTED,
      tx,
    );
    await unreserveVins(vinsToUnreserve, tx);
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

export const directorReturnToAnalyst = async (
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
      status: CreditApplicationStatus.RECOMMEND_APPROVAL,
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
    select: {
      organizationId: true,
      submissionTimestamp: true,
    },
  });
  if (!creditApplication || !creditApplication.submissionTimestamp) {
    return getErrorActionResponse("Invalid Action!");
  }
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
  const now = new Date();
  const applicationComplianceYear = getComplianceYear(
    creditApplication.submissionTimestamp,
  );
  const { openUpperBound: thresholdDate } = getCompliancePeriod(
    applicationComplianceYear,
  );
  let transactionTimestamp = now;
  if (thresholdDate <= now) {
    transactionTimestamp = getComplianceDate(applicationComplianceYear);
  }
  const transactionsToCreate: Prisma.ZevUnitTransactionCreateManyInput[] = [];
  credits.forEach((credit) => {
    transactionsToCreate.push({
      organizationId: creditApplication.organizationId,
      timestamp: transactionTimestamp,
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
    await tx.creditApplication.update({
      where: {
        id: creditApplicationId,
      },
      data: {
        transactionTimestamp,
        status: CreditApplicationStatus.APPROVED,
        supplierStatus: CreditApplicationStatus.APPROVED,
      },
    });
    await unreserveVins(invalidVins, tx);
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
