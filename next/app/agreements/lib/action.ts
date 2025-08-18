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
import { historySelectClause } from "./utils";

export type AgreementContentPayload = {
  zevClass: ZevClass;
  modelYear: ModelYear;
  numberOfUnits: number;
};

export type AgreementPayload = Omit<Agreement, "id"> & {
  agreementContent: AgreementContentPayload[];
};

/**
 * Upsert changes to an existing agreement in the database.
 * @param data - The agreement data to save.
 * @param id - The ID of the agreement to update. If not provided,
 *    a new agreement will be created.
 * @returns the upserted agreement, or undefined if the process failed.
 */
export const saveAgreement = async (data: AgreementPayload, id?: number) => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
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
}

/**
 * Adds a comment and the associated history to an agreement.
 * @param agreementId - The ID of the agreement to comment on.
 * @param comment - The comment text to add.
 * @returns The created comment history record, or null if the process failed.
 */
export const addComment = async (
  agreementId: number,
  comment: string
) => {
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
      select: historySelectClause
    });
  } catch (error) {
    console.error("Error adding comment:", (error as Error).message);
    return null;
  }
};
