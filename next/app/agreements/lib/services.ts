import { getCurrentComplianceYear } from "@/app/lib/utils/complianceYear";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AgreementStatus,
  AgreementUserAction,
  ModelYear
} from "@/prisma/generated/client";
import { historySelectClause } from "./utils";

export const getSupplierSelections = async () => {
  return await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isGovernment: false,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getModelYearSelections = () => {
  const currentComplianceYear = getCurrentComplianceYear().toString();
  const modelYearSelections = Object.values(ModelYear).filter(
    year => year.substring(3) <= currentComplianceYear
  );
  return modelYearSelections;
};

export const getAgreementDetails = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();

  const [
    basicInfo,
    agreementHistory
  ] = await prisma.$transaction(async (tx) => {
    const basicInfo = tx.agreement.findUnique({
      where: {
        id,
        organizationId: userIsGov ? undefined : userOrgId,
        status: userIsGov ? undefined : AgreementStatus.ISSUED,
      },
      include: {
        organization: true,
        agreementContent: {
          select: {
            zevClass: true,
            modelYear: true,
            numberOfUnits: true,
          },
        },
      },
    });

    const history = userIsGov ? tx.agreementHistory.findMany({
      where: {
        agreementId: id,
        userAction: { not: AgreementUserAction.SAVED },
      },
      select: historySelectClause
    }): undefined;

    return await Promise.all([basicInfo, history]);
  });

  if (!basicInfo) {
    return null; // Agreement not found
  }

  return {
    ...basicInfo,
    agreementContent: basicInfo.agreementContent.map((content) => ({
      ...content,
      numberOfUnits: content.numberOfUnits.toNumber()
    })),
    agreementHistory
  };
};

export type AgreementDetailsType = Exclude<
  Awaited<ReturnType<typeof getAgreementDetails>>,
  null
>;

export type AgreementHistoryType = Exclude<
  AgreementDetailsType["agreementHistory"],
  undefined
>[number];
