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
import {
  historySelectClause,
  getAgreementAttachmentFullObjectName,
} from "./utils";
import {
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
  removeObjects,
} from "@/app/lib/minio";
import { randomUUID } from "crypto";
import { Attachment, AttachmentDownload } from "@/app/lib/services/attachments";
import {
  DataOrErrorActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
} from "@/app/lib/utils/actionResponse";

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
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return undefined; // Only government users with ZEVA IDIR User role can update agreements
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

      await tx.agreementAttachment.createMany({
        data: files.map((file) => ({
          agreementId,
          fileName: file.fileName,
          objectName: file.objectName,
        })),
      });

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
    await removeObjects(
      files.map((file) =>
        getAgreementAttachmentFullObjectName(file.objectName),
      ),
    );

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

/**
 * Get presigned URLs for uploading files.
 * @param numberOfFiles - The number of files to upload.
 * @returns A promise that resolves to an array of presigned URLs.
 */
export const getPutObjectData = async (
  numberOfFiles: number,
): Promise<AgreementPutObjectData[]> => {
  const result: AgreementPutObjectData[] = [];
  for (let i = 0; i < numberOfFiles; i++) {
    const objectName = randomUUID();
    const url = await getPresignedPutObjectUrl(
      getAgreementAttachmentFullObjectName(objectName),
    );
    result.push({
      objectName,
      url,
    });
  }
  return result;
};

/**
 * Get download URLs for agreement attachments.
 * @param attachments - The list of attachments to get download URLs for.
 * @returns A promise that resolves to the download URLs or an error response.
 */
export const getAgreementAttachmentDownloadUrls = async (
  attachments: Attachment[],
): Promise<DataOrErrorActionResponse<AttachmentDownload[]>> => {
  if (attachments.length === 0) {
    return getErrorActionResponse("No attachments found!");
  }
  const result = await Promise.all(
    attachments.map(async (attachment) => ({
      fileName: attachment.fileName,
      url: await getPresignedGetObjectUrl(
        getAgreementAttachmentFullObjectName(attachment.objectName),
      ),
    })),
  );
  return getDataActionResponse(result);
};

/**
 * Deletes an agreement attachment by its MinIO object name,
 *   removing it from both the prisma database and MinIO bucket.
 * @param objectName - The MinIO object name of the attachment to delete.
 * @returns True if the deletion was successful, false otherwise.
 */
export const deleteAgreementAttachment = async (objectName: string) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete from database
      await tx.agreementAttachment.deleteMany({
        where: { objectName },
      });

      // Delete from MinIO
      await removeObjects([getAgreementAttachmentFullObjectName(objectName)]);
    });
    return true;
  } catch (error) {
    console.error(
      "Error deleting agreement attachment:",
      (error as Error).message,
    );
    return false;
  }
};
