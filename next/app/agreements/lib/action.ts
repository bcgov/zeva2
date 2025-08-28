"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Agreement,
  AgreementStatus,
  AgreementUserAction,
  ModelYear,
  Role,
  ZevClass,
} from "@/prisma/generated/client";
import { historySelectClause, getAgreementAttachmentFullObjectName } from "./utils";
import {
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
} from "@/app/lib/minio";
import { randomUUID } from "crypto";
import {
  Attachment,
  AttachmentDownload,
  deleteAttachments,
} from "@/app/lib/services/attachments";
import {
  DataOrErrorActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
} from "@/app/lib/utils/actionResponse";
import { TransactionClient } from "@/types/prisma";

export type AgreementContentPayload = {
  zevClass: ZevClass;
  modelYear: ModelYear;
  numberOfUnits: number;
};

export type AgreementPayload = Omit<Agreement, "id"> & {
  agreementContent: AgreementContentPayload[];
};

export type AgreementPutObjectData = {
  objectName: string;
  url: string;
};

export const getPutObjectData = async (
  numberOfFiles: number,
  orgId: number,
): Promise<AgreementPutObjectData[]> => {
  const result: AgreementPutObjectData[] = [];
  for (let i = 0; i < numberOfFiles; i++) {
    const objectName = randomUUID();
    const url = await getPresignedPutObjectUrl(
      getAgreementAttachmentFullObjectName(orgId, objectName),
    );
    result.push({
      objectName,
      url,
    });
  }
  return result;
};

const createAgreementAttachments = async (
  agreementId: number,
  files: Attachment[],
  transactionClient?: TransactionClient,
) => {
  if (files.length === 0) return;
  const tx = transactionClient ?? prisma;
  await tx.agreementAttachment.createMany({
    data: files.map((file) => ({
      agreementId,
      fileName: file.fileName,
      objectName: file.objectName,
    })),
  });
};

/**
 * Upsert changes to an existing agreement in the database.
 * @param data - The agreement data to save.
 * @param files - The file attachments to upload.
 * @param id - The ID of the agreement to update. If not provided,
 *    a new agreement will be created.
 * @returns the upserted agreement, or undefined if the process failed.
 */
export const saveAgreement = async (
  data: AgreementPayload,
  files: Attachment[] = [],
  id?: number,
) => {
  const { userId, userIsGov, userRoles, userOrgId } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ENGINEER_ANALYST)) {
    return undefined; // Only government users with ENGINEER_ANALYST role can update agreements
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const { agreementContent, ...mainData } = data;

      const savedAgreement = id
        ? await tx.agreement.update({
            where: { id },
            data: mainData,
          })
        : await tx.agreement.create({
            data: mainData,
          });
      const agreementId = savedAgreement.id;

      await tx.agreementContent.deleteMany({
        where: { agreementId },
      });

      await tx.agreementContent.createMany({
        data: agreementContent
          .filter((content) => content.numberOfUnits > 0)
          .map((content) => ({
            ...content,
            agreementId,
          })),
      });

      // Handle file attachments
      await createAgreementAttachments(agreementId, files, tx);

      await tx.agreementHistory.create({
        data: {
          agreementId,
          userId,
          timestamp: new Date(),
          userAction: AgreementUserAction.SAVED,
        },
      });

      return savedAgreement;
    });
  } catch (error) {
    // Clean up uploaded files if transaction fails
    await deleteAttachments(userOrgId, files, getAgreementAttachmentFullObjectName);

    console.error("Error saving agreement:", (error as Error).message);
    return undefined;
  }
};

/**
 * Change the status of an existing agreement and insert a history record in the database.
 * @param id - The ID of the agreement to update.
 * @param status - The new status to set.
 * @returns true if the update was successful, false otherwise.
 */
export const updateStatus = async (id: number, status: AgreementStatus) => {
  const { userId, userIsGov } = await getUserInfo();
  if (!userIsGov || status === AgreementStatus.DRAFT) {
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.agreement.update({
        where: { id },
        data: { status },
      });
      await tx.agreementHistory.create({
        data: {
          agreementId: id,
          userId,
          timestamp: new Date(),
          userAction: status,
        },
      });
    });
    return true;
  } catch (error) {
    console.error("Error updating agreement status:", (error as Error).message);
    return false;
  }
};

/**
 * Adds a comment and the associated history to an agreement.
 * @param agreementId - The ID of the agreement to comment on.
 * @param comment - The comment text to add.
 * @returns The created comment history record, or null if the process failed.
 */
export const addComment = async (agreementId: number, comment: string) => {
  const { userId, userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }

  try {
    return await prisma.agreementHistory.create({
      data: {
        agreementId,
        userId,
        timestamp: new Date(),
        userAction: AgreementUserAction.ADDED_COMMENT_GOV_INTERNAL,
        agreementComment: { create: { comment } },
      },
      select: historySelectClause,
    });
  } catch (error) {
    console.error("Error adding comment:", (error as Error).message);
    return null;
  }
};

export const getAgreementAttachmentDownloadUrls = async (
  id: number,
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  
  const attachments = await prisma.agreementAttachment.findMany({
    where: {
      agreementId: id,
      agreement: userIsGov ? undefined : {
        organizationId: userOrgId,
        status: AgreementStatus.ISSUED,
      },
    },
    select: {
      fileName: true,
      objectName: true,
      agreement: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (attachments.length === 0) {
    return getErrorActionResponse("No attachments found!");
  }

  const result: AttachmentDownload[] = [];
  for (const attachment of attachments) {
    result.push({
      fileName: attachment.fileName,
      url: await getPresignedGetObjectUrl(
        getAgreementAttachmentFullObjectName(
          attachment.agreement.organizationId,
          attachment.objectName,
        ),
      ),
    });
  }
  return getDataActionResponse(result);
};
