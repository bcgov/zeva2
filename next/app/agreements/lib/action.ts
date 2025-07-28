import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Agreement,
  AgreementUserAction,
  ModelYear,
  Role,
  ZevClass,
} from "@/prisma/generated/client";

export type AgreementContentPayload = {
  zevClass: ZevClass;
  modelYear: ModelYear;
  numberOfUnits: number;
}

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
export const saveAgreement = async (
  data: AgreementPayload,
  id?: number,
) => {
  const { userId, userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ENGINEER_ANALYST)) {
    return undefined; // Only government users with ENGINEER_ANALYST role can update agreements
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
  try {
    return await prisma.$transaction(async (tx) => {
      const { agreementContent, ...mainData } = data;

      const savedAgreement = id ?
        await tx.agreement.update({
          where: { id },
          data: mainData,
        }) :
        await tx.agreement.create({
          data: mainData,
        });
      const agreementId = savedAgreement.id;

      await tx.agreementContent.deleteMany({
        where: { agreementId },
      });

      await tx.agreementContent.createMany({
        data: agreementContent.map((content) => ({
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
