"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Agreement,
  AgreementStatus,
  AgreementType,
  ModelYear,
  Prisma,
  ReferenceType,
  Role,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { getPresignedGetObjectUrl } from "@/app/lib/minio";
import {
  Attachment,
  AttachmentDownload,
  checkAttachments,
  getPutObjectData,
} from "@/app/lib/services/attachments";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { createHistory, updateAttachments } from "./services";
import { getCreditsSum } from "./utilsServer";
import { validateDate } from "@/app/lib/utils/date";

export type AgreementContentPayload = {
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  modelYear: ModelYear;
  numberOfUnits: string;
};

export type AgreementPayload = Omit<
  Agreement,
  "id" | "aCredits" | "bCredits"
> & {
  agreementContent: AgreementContentPayload[];
};

export type AgreementPutObjectData = {
  objectName: string;
  url: string;
};

export const getVehicleAttachmentsPutData = async (
  numberOfFiles: number,
  organizationId: number,
): Promise<DataOrErrorActionResponse<AgreementPutObjectData[]>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const putObjectData = await getPutObjectData(
    numberOfFiles,
    "agreement",
    organizationId,
  );
  return getDataActionResponse(putObjectData);
};

export const getAgreementAttachmentDownloadUrls = async (
  agreementId: number,
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.AgreementAttachmentWhereInput = {
    agreementId,
    fileName: { not: null },
  };
  if (!userIsGov) {
    whereClause.agreement = {
      organizationId: userOrgId,
      status: AgreementStatus.ISSUED,
    };
  }
  const attachments = await prisma.agreementAttachment.findMany({
    where: whereClause,
    select: {
      fileName: true,
      objectName: true,
    },
  });
  const result: AttachmentDownload[] = [];
  for (const attachment of attachments) {
    if (attachment.fileName) {
      result.push({
        fileName: attachment.fileName,
        url: await getPresignedGetObjectUrl(attachment.objectName),
      });
    }
  }
  return getDataActionResponse(result);
};

export const createAgreement = async (
  organizationId: number,
  agreementType: AgreementType,
  date: string,
  content: AgreementContentPayload[],
  attachments: Attachment[],
): Promise<DataOrErrorActionResponse<number>> => {
  let agreementId = NaN;
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  try {
    await checkAttachments(attachments, "agreement", organizationId);
  } catch {
    return getErrorActionResponse("Attachments Error!");
  }
  const { aCredits, bCredits } = getCreditsSum(content);
  await prisma.agreementContent.createMany({
    data: [],
  });
  await prisma.$transaction(async (tx) => {
    const createdAgreement = await tx.agreement.create({
      data: {
        organizationId,
        status: AgreementStatus.DRAFT,
        agreementType,
        date,
        aCredits,
        bCredits,
      },
    });
    agreementId = createdAgreement.id;
    await tx.agreementContent.createMany({
      data: content.map((record) => {
        return { agreementId, ...record };
      }),
    });
    await updateAttachments(agreementId, attachments);
  });
  return getDataActionResponse(agreementId);
};

export const saveAgreement = async (
  agreementId: number,
  date: string,
  content: AgreementContentPayload[],
  attachments: Attachment[],
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const agreement = await prisma.agreement.findUnique({
    where: {
      id: agreementId,
      status: {
        in: [AgreementStatus.DRAFT, AgreementStatus.RETURNED_TO_ANALYST],
      },
    },
  });
  if (!agreement) {
    return getErrorActionResponse("Invalid Action!");
  }
  try {
    await checkAttachments(attachments, "agreement", agreement.organizationId);
  } catch {
    return getErrorActionResponse("Attachments Error!");
  }
  const { aCredits, bCredits } = getCreditsSum(content);
  await prisma.$transaction(async (tx) => {
    await tx.agreementAttachment.deleteMany({
      where: {
        agreementId,
      },
    });
    await updateAttachments(agreementId, attachments);
    await tx.agreementContent.deleteMany({
      where: {
        agreementId,
      },
    });
    await tx.agreementContent.createMany({
      data: content.map((record) => {
        return { agreementId, ...record };
      }),
    });
    await tx.agreement.update({
      where: {
        id: agreementId,
      },
      data: {
        date,
        aCredits,
        bCredits,
      },
    });
  });
  return getDataActionResponse(agreementId);
};

export const deleteAgreement = async (
  agreementId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const agreement = await prisma.agreement.findUnique({
    where: {
      id: agreementId,
      status: {
        in: [AgreementStatus.DRAFT, AgreementStatus.RETURNED_TO_ANALYST],
      },
    },
  });
  if (!agreement) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.agreementAttachment.deleteMany({
      where: {
        agreementId,
      },
    });
    await tx.agreementHistory.deleteMany({
      where: {
        agreementId,
      },
    });
    await tx.agreement.delete({
      where: {
        id: agreementId,
      },
    });
  });
  return getSuccessActionResponse();
};

export const recommendApproval = async (
  agreementId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const agreement = await prisma.agreement.findUnique({
    where: {
      id: agreementId,
      status: {
        in: [AgreementStatus.DRAFT, AgreementStatus.RETURNED_TO_ANALYST],
      },
    },
  });
  if (!agreement) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.agreement.update({
      where: { id: agreementId },
      data: { status: AgreementStatus.RECOMMEND_APPROVAL },
    });
    await createHistory(
      agreementId,
      userId,
      AgreementStatus.RECOMMEND_APPROVAL,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const returnToAnalyst = async (
  agreementId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const agreement = await prisma.agreement.findUnique({
    where: {
      id: agreementId,
      status: {
        in: [AgreementStatus.RECOMMEND_APPROVAL],
      },
    },
  });
  if (!agreement) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.agreement.update({
      where: { id: agreementId },
      data: { status: AgreementStatus.RETURNED_TO_ANALYST },
    });
    await createHistory(
      agreementId,
      userId,
      AgreementStatus.RETURNED_TO_ANALYST,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const issueAgreement = async (
  agreementId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const agreement = await prisma.agreement.findUnique({
    where: {
      id: agreementId,
      status: AgreementStatus.RECOMMEND_APPROVAL,
    },
    include: {
      agreementContent: true,
    },
  });
  if (!agreement) {
    return getErrorActionResponse("Invalid Action!");
  }
  const [dateIsValid, timestamp] = validateDate(agreement.date);
  if (!dateIsValid) {
    return getErrorActionResponse("Invalid Date!");
  }
  const transactionsToCreate: Prisma.ZevUnitTransactionCreateManyInput[] = [];
  for (const record of agreement.agreementContent) {
    transactionsToCreate.push({
      organizationId: agreement.organizationId,
      type: TransactionType.CREDIT,
      referenceType: ReferenceType.AGREEMENT,
      referenceId: agreementId,
      vehicleClass: record.vehicleClass,
      zevClass: record.zevClass,
      modelYear: record.modelYear,
      numberOfUnits: record.numberOfUnits,
      timestamp,
    });
  }
  await prisma.$transaction(async (tx) => {
    await tx.zevUnitTransaction.createMany({
      data: transactionsToCreate,
    });
    await tx.agreement.update({
      where: {
        id: agreementId,
      },
      data: {
        status: AgreementStatus.ISSUED,
      },
    });
    await createHistory(
      agreementId,
      userId,
      AgreementStatus.ISSUED,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};
