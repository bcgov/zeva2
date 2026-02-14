"use server";

import { getObject, getPresignedGetObjectUrl } from "@/app/lib/minio";
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
  ZevClass,
} from "@/prisma/generated/client";
import Excel from "exceljs";
import {
  getTransactionTimestamp,
  getWarningsMap,
  parseSupplierSubmission,
} from "./utils";
import {
  createHistory,
  deleteAttachments,
  getApplicationFlattenedCreditRecords,
  getEligibleVehicles,
  getEligibleVehiclesMap,
  getIcbcRecordsMap,
  getOrgInfo,
  getReservedVins,
  getVehicleCounts,
  unreserveVins,
  updateStatus,
  updateAttachments,
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
  checkAttachments,
  getPutObjectData,
} from "@/app/lib/services/attachments";
import { addJobToEmailQueue } from "@/app/lib/services/queue";
import {
  getComplianceDate,
  getIsInReportingPeriod,
  getPreviousComplianceYear,
} from "@/app/lib/utils/complianceYear";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getLatestSuccessfulFileTimestamp } from "@/app/icbc/lib/services";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";

export const getSupplierTemplateDownloadUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${SupplierTemplate.Name}`,
  );
};

export const getCreditApplicationAttachmentPutData = async (
  numberOfFiles: number,
) => {
  const { userOrgId } = await getUserInfo();
  return await getPutObjectData(numberOfFiles, "creditApplication", userOrgId);
};

export const getSupplierEligibleVehicles = async () => {
  const { userOrgId } = await getUserInfo();
  const now = new Date();
  const isInReportingPeriod = getIsInReportingPeriod(now);
  if (isInReportingPeriod) {
    const complianceYear = getPreviousComplianceYear(now);
    return await getEligibleVehicles(userOrgId, [complianceYear], false);
  }
  return await getEligibleVehicles(userOrgId, "all", false);
};

export const getDocumentDownloadUrls = async (
  creditApplicationId: number,
): Promise<
  DataOrErrorActionResponse<(AttachmentDownload & { isApplication: boolean })[]>
> => {
  const result: (AttachmentDownload & { isApplication: boolean })[] = [];
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.CreditApplicationAttachmentWhereInput = {
    creditApplicationId,
    fileName: { not: null },
  };
  if (userIsGov) {
    whereClause.creditApplication = {
      status: {
        notIn: [
          CreditApplicationStatus.DRAFT,
          CreditApplicationStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    };
  }
  if (!userIsGov) {
    whereClause.creditApplication = {
      organizationId: userOrgId,
    };
  }
  const attachments = await prisma.creditApplicationAttachment.findMany({
    where: whereClause,
    select: {
      objectName: true,
      fileName: true,
      isApplication: true,
    },
  });
  for (const attachment of attachments) {
    if (attachment.fileName) {
      result.push({
        url: await getPresignedGetObjectUrl(attachment.objectName),
        fileName: attachment.fileName,
        isApplication: attachment.isApplication,
      });
    }
  }
  return getDataActionResponse(result);
};

// first attachment must be the CA file
export const supplierSave = async (
  attachments: Attachment[],
  creditApplicationId?: number,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  if (userIsGov || !userRoles.includes(Role.ZEVA_BCEID_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const application = attachments[0];
  if (!application) {
    return getErrorActionResponse("Invalid Action!");
  }
  if (creditApplicationId) {
    const creditApplication = await prisma.creditApplication.findUnique({
      where: {
        id: creditApplicationId,
        organizationId: userOrgId,
        status: CreditApplicationStatus.DRAFT,
      },
      select: {
        id: true,
      },
    });
    if (!creditApplication) {
      return getErrorActionResponse("Invalid Action!");
    }
  }
  let applicationId = creditApplicationId ?? Number.NaN;
  try {
    await checkAttachments(attachments, "creditApplication", userOrgId);
    const applicationObject = await getObject(application.objectName);
    const applicationBuf = await getArrayBuffer(applicationObject);
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(applicationBuf);
    const recordsToCreatePrelim: Omit<
      Prisma.CreditApplicationRecordCreateManyInput,
      "creditApplicationId"
    >[] = [];
    const modelYears: Set<ModelYear> = new Set();
    const orgInfo = await getOrgInfo(userOrgId);
    const dataSheet = workbook.getWorksheet(
      SupplierTemplate.ZEVsSuppliedSheetName,
    );
    if (!dataSheet) {
      throw new Error("Expected sheet not found!");
    }
    const data = parseSupplierSubmission(dataSheet);
    for (const [_vin, info] of Object.entries(data)) {
      modelYears.add(info.modelYear);
    }
    const vehiclesMap = await getEligibleVehiclesMap(
      userOrgId,
      Array.from(modelYears),
    );
    const vinsMissingVehicles: string[] = [];
    for (const [vin, info] of Object.entries(data)) {
      const vehicleInfo =
        vehiclesMap[info.make]?.[info.modelName]?.[info.modelYear];
      if (!vehicleInfo) {
        vinsMissingVehicles.push(vin);
      } else {
        recordsToCreatePrelim.push({
          vin,
          make: info.make,
          modelName: info.modelName,
          modelYear: info.modelYear,
          timestamp: info.timestamp,
          vehicleClass: vehicleInfo[1],
          zevClass: vehicleInfo[2],
          numberOfUnits: vehicleInfo[3],
          zevType: vehicleInfo[4],
          range: vehicleInfo[5],
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
      if (creditApplicationId) {
        await tx.creditApplication.update({
          where: {
            id: creditApplicationId,
          },
          data: {
            modelYears: Array.from(modelYears),
            supplierName: orgInfo.name,
            makes: orgInfo.makes,
            serviceAddress: orgInfo.serviceAddress,
            recordsAddress: orgInfo.recordsAddress,
          },
        });
        await tx.creditApplicationRecord.deleteMany({
          where: {
            creditApplicationId,
          },
        });
      } else {
        const newApplication = await tx.creditApplication.create({
          data: {
            organizationId: userOrgId,
            status: CreditApplicationStatus.DRAFT,
            supplierStatus: CreditApplicationStatus.DRAFT,
            modelYears: Array.from(modelYears),
            supplierName: orgInfo.name,
            makes: orgInfo.makes,
            serviceAddress: orgInfo.serviceAddress,
            recordsAddress: orgInfo.recordsAddress,
          },
          select: {
            id: true,
          },
        });
        applicationId = newApplication.id;
      }
      const recordsToCreate: Prisma.CreditApplicationRecordCreateManyInput[] =
        [];
      for (const record of recordsToCreatePrelim) {
        recordsToCreate.push({ ...record, creditApplicationId: applicationId });
      }
      await tx.creditApplicationRecord.createMany({
        data: recordsToCreate,
      });
      await deleteAttachments(applicationId, tx);
      await updateAttachments(applicationId, attachments, 0, tx);
    });
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getDataActionResponse(applicationId);
};

export const supplierDelete = async (
  creditApplicationId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  if (userIsGov || !userRoles.includes(Role.ZEVA_BCEID_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      organizationId: userOrgId,
      status: {
        in: [
          CreditApplicationStatus.DRAFT,
          CreditApplicationStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditApplicationAttachment.deleteMany({
      where: {
        creditApplicationId,
      },
    });
    await tx.creditApplicationHistory.deleteMany({
      where: {
        creditApplicationId,
      },
    });
    await tx.creditApplicationRecord.deleteMany({
      where: {
        creditApplicationId,
      },
    });
    await tx.creditApplication.delete({
      where: {
        id: creditApplicationId,
      },
    });
  });
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
      modelYears: true,
      CreditApplicationRecord: {
        select: {
          vin: true,
          make: true,
          modelName: true,
          modelYear: true,
          timestamp: true,
        },
      },
    },
  });
  if (
    !application ||
    application.modelYears.length === 0 ||
    application.CreditApplicationRecord.length === 0
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  const now = new Date();
  const isInReportingPeriod = getIsInReportingPeriod(now);
  const records = application.CreditApplicationRecord;
  const modelYearsMap = getModelYearEnumsToStringsMap();
  try {
    if (isInReportingPeriod) {
      const complianceYear = getPreviousComplianceYear(now);
      const complianceDate = getComplianceDate(complianceYear);
      const invalidReportingPeriodVins: string[] = [];
      for (const record of records) {
        if (
          record.modelYear !== complianceYear ||
          record.timestamp > complianceDate
        ) {
          invalidReportingPeriodVins.push(record.vin);
        }
      }
      if (invalidReportingPeriodVins.length > 0) {
        const modelYear = modelYearsMap[complianceYear];
        throw new Error(
          `Between Oct. 1st and Oct. 20th, you can only submit 
          VINs with a model year of ${modelYear}, and with a date before Sept. 30th, ${modelYear}.
          These are the invalid VINs: ${invalidReportingPeriodVins.join(", ")}`,
        );
      }
    }
    const invalidDateVins: string[] = [];
    for (const record of records) {
      if (record.timestamp > new Date()) {
        invalidDateVins.push(record.vin);
      }
    }
    if (invalidDateVins.length > 0) {
      throw new Error(`VINs with future dates: ${invalidDateVins.join(", ")}`);
    }
    const vins = records.reduce((acc: string[], cv) => {
      return [...acc, cv.vin];
    }, []);
    const reservedVins = await getReservedVins(vins);
    if (reservedVins.length > 0) {
      throw new Error(`Reserved VINs: ${reservedVins.join(", ")}`);
    }
    const vehicleCounts = await getVehicleCounts(creditApplicationId, "all");
    await prisma.$transaction(async (tx) => {
      await tx.creditApplication.update({
        where: {
          id: creditApplicationId,
        },
        data: {
          status: CreditApplicationStatus.SUBMITTED,
          supplierStatus: CreditApplicationStatus.SUBMITTED,
          submissionTimestamp: new Date(),
        },
      });
      await tx.reservedVin.createMany({
        data: vins.reduce((acc: { vin: string }[], cv) => {
          return [...acc, { vin: cv }];
        }, []),
      });
      const historyId = await createHistory(
        userId,
        creditApplicationId,
        CreditApplicationStatus.SUBMITTED,
        comment,
        tx,
      );
      for (const [vehicleId, count] of vehicleCounts) {
        await tx.vehicle.update({
          where: {
            id: vehicleId,
          },
          data: {
            submittedCount: {
              increment: count,
            },
          },
        });
      }
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
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
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
    include: {
      CreditApplicationRecord: true,
    },
  });
  if (!creditApplication) {
    return getErrorActionResponse("Invalid Action!");
  }
  const latestIcbcFileTimestamp = await getLatestSuccessfulFileTimestamp();
  if (!latestIcbcFileTimestamp) {
    return getErrorActionResponse("No ICBC files to validate against!");
  }
  const records = creditApplication.CreditApplicationRecord;
  const vins = records.reduce((acc: string[], cv) => {
    return [...acc, cv.vin];
  }, []);
  const icbcMap = await getIcbcRecordsMap(vins);
  const warningsMap = getWarningsMap(records, icbcMap);
  let eligibleVinsCount = 0;
  let ineligibleVinsCount = 0;
  let aCredits = new Decimal(0);
  let bCredits = new Decimal(0);
  for (const record of records) {
    const vin = record.vin;
    let validated;
    const warnings = warningsMap[vin];
    if (warnings) {
      validated = false;
      ineligibleVinsCount = ineligibleVinsCount + 1;
    } else {
      validated = true;
      eligibleVinsCount = eligibleVinsCount + 1;
      const zevClass = record.zevClass;
      const numberOfUnits = record.numberOfUnits;
      if (zevClass === ZevClass.A) {
        aCredits = aCredits.plus(numberOfUnits);
      } else if (zevClass === ZevClass.B) {
        bCredits = bCredits.plus(numberOfUnits);
      }
    }
    record.icbcMake = icbcMap[vin]?.make ?? null;
    record.icbcModelName = icbcMap[vin]?.modelName ?? null;
    record.icbcModelYear = icbcMap[vin]?.modelYear ?? null;
    record.validated = validated;
    record.warnings = warnings ? warnings : [];
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditApplicationRecord.deleteMany({
      where: {
        creditApplicationId,
      },
    });
    await tx.creditApplicationRecord.createMany({
      data: records,
    });
    await tx.creditApplication.update({
      where: {
        id: creditApplicationId,
      },
      data: {
        icbcTimestamp: latestIcbcFileTimestamp,
        eligibleVinsCount,
        ineligibleVinsCount,
        aCredits,
        bCredits,
      },
    });
  });
  return getSuccessActionResponse();
};

export type MapOfValidatedAndReasons = Record<number, [boolean, string | null]>;

export const updateValidatedRecords = async (
  creditApplicationId: number,
  mapOfData: MapOfValidatedAndReasons,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const creditApplication = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
    },
    select: {
      status: true,
      eligibleVinsCount: true,
      ineligibleVinsCount: true,
      aCredits: true,
      bCredits: true,
    },
  });
  if (
    !creditApplication ||
    (creditApplication.status !== CreditApplicationStatus.SUBMITTED &&
      creditApplication.status !== CreditApplicationStatus.RETURNED_TO_ANALYST)
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  let eligibleVinsCount = creditApplication.eligibleVinsCount;
  let ineligibleVinsCount = creditApplication.ineligibleVinsCount;
  let aCredits = creditApplication.aCredits;
  let bCredits = creditApplication.bCredits;
  if (
    eligibleVinsCount === null ||
    ineligibleVinsCount === null ||
    aCredits === null ||
    bCredits === null
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  const records = await prisma.creditApplicationRecord.findMany({
    where: {
      id: {
        in: Object.keys(mapOfData).reduce((acc: number[], cv) => {
          return [...acc, Number.parseInt(cv, 10)];
        }, []),
      },
    },
  });
  const recordIds: number[] = [];
  for (const record of records) {
    const id = record.id;
    recordIds.push(record.id);
    const zevClass = record.zevClass;
    const numberOfUnits = record.numberOfUnits;
    const oldValidated = record.validated;
    const newValidated = mapOfData[id][0];
    if (oldValidated && !newValidated) {
      eligibleVinsCount = eligibleVinsCount - 1;
      ineligibleVinsCount = ineligibleVinsCount + 1;
      if (zevClass === ZevClass.A) {
        aCredits = aCredits.minus(numberOfUnits);
      } else if (zevClass === ZevClass.B) {
        bCredits = bCredits.minus(numberOfUnits);
      }
    } else if (!oldValidated && newValidated) {
      eligibleVinsCount = eligibleVinsCount + 1;
      ineligibleVinsCount = ineligibleVinsCount - 1;
      if (zevClass === ZevClass.A) {
        aCredits = aCredits.plus(numberOfUnits);
      } else if (zevClass === ZevClass.B) {
        bCredits = bCredits.plus(numberOfUnits);
      }
    }
    record.validated = newValidated;
    record.reason = mapOfData[id][1];
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditApplicationRecord.deleteMany({
      where: {
        id: {
          in: recordIds,
        },
      },
    });
    await tx.creditApplicationRecord.createMany({
      data: records,
    });
    await tx.creditApplication.update({
      where: {
        id: creditApplicationId,
      },
      data: {
        eligibleVinsCount,
        ineligibleVinsCount,
        aCredits,
        bCredits,
      },
    });
  });
  return getSuccessActionResponse();
};

export const analystRecommend = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ZEVA_IDIR_USER)) {
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

export const analystReturn = async (
  creditApplicationId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!userIsGov || !userRoles.some((role) => role === Role.ZEVA_IDIR_USER)) {
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
  let counts;
  try {
    counts = await getVehicleCounts(creditApplicationId, "all");
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  await prisma.$transaction(async (tx) => {
    await updateStatus(
      creditApplicationId,
      CreditApplicationStatus.RETURNED_TO_SUPPLIER,
      tx,
    );
    await unreserveVins(vinsToUnreserve, tx);
    const historyId = await createHistory(
      userId,
      creditApplicationId,
      CreditApplicationStatus.RETURNED_TO_SUPPLIER,
      comment,
      tx,
    );
    for (const [vehicleId, count] of counts) {
      await tx.vehicle.update({
        where: {
          id: vehicleId,
        },
        data: {
          submittedCount: {
            decrement: count,
          },
        },
      });
    }
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
  const transactionsToCreate: Prisma.ZevUnitTransactionCreateManyInput[] = [];
  const creditRecords =
    await getApplicationFlattenedCreditRecords(creditApplicationId);
  const issuanceTimestamp = new Date();
  const transactionTimestamps: Set<Date> = new Set();
  for (const record of creditRecords) {
    const modelYear = record.modelYear;
    const timestamp = getTransactionTimestamp(
      creditApplication.submissionTimestamp,
      issuanceTimestamp,
      modelYear,
    );
    transactionTimestamps.add(timestamp);
    transactionsToCreate.push({
      organizationId: creditApplication.organizationId,
      timestamp,
      type: TransactionType.CREDIT,
      referenceType: ReferenceType.SUPPLY_CREDITS,
      referenceId: creditApplicationId,
      vehicleClass: record.vehicleClass,
      zevClass: record.zevClass,
      modelYear: modelYear,
      numberOfUnits: record.numberOfUnits,
    });
  }
  let counts;
  try {
    counts = await getVehicleCounts(creditApplicationId, "validated");
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditApplication.update({
      where: {
        id: creditApplicationId,
      },
      data: {
        transactionTimestamps: Array.from(transactionTimestamps),
        status: CreditApplicationStatus.APPROVED,
        supplierStatus: CreditApplicationStatus.APPROVED,
      },
    });
    await unreserveVins(invalidVins, tx);
    for (const [vehicleId, count] of counts) {
      await tx.vehicle.update({
        where: {
          id: vehicleId,
        },
        data: {
          issuedCount: {
            increment: count,
          },
          submittedCount: {
            decrement: count,
          },
        },
      });
    }
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
