import { getCurrentComplianceYear } from "@/app/lib/utils/complianceYear";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AgreementStatus, ModelYear } from "@/prisma/generated/client";

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
    (year) => year.substring(3) <= currentComplianceYear,
  );
  return modelYearSelections;
};

export const getAgreementDetails = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();

  const agreement = await prisma.agreement.findUnique({
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
      agreementHistory: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          timestamp: true,
          userAction: true,
          comment: true,
        },
      },
    },
  });

  if (!agreement) {
    return null; // Agreement not found or access denied
  }

  return {
    ...agreement,
    agreementContent: agreement.agreementContent.map((content) => ({
      ...content,
      numberOfUnits: content.numberOfUnits.toNumber(),
    })),
  };
};

export type AgreementDetailsType = Exclude<
  Awaited<ReturnType<typeof getAgreementDetails>>,
  null
>;
