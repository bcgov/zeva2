import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { ModelYear, Role, ZevClass } from "@/prisma/generated/client";
import { AgreementEditForm } from "../lib/components/AgreementEditForm";
import { prisma } from "@/lib/prisma";
import { getCurrentComplianceYear } from "@/app/lib/utils/complianceYear";
import { AgreementPayload, saveAgreement } from "../lib/action";

const Page = async () => {
  const { userRoles } = await getUserInfo();
  if (!userRoles.includes(Role.ENGINEER_ANALYST)) {
    return (
      <div className="p-6 font-semibold">
        You do not have access to this page.
      </div>
    );
  }

  const supplierSelections = await prisma.organization.findMany({
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

  const currentComplianceYear = getCurrentComplianceYear().toString();
  const modelYearSelections = Object.values(ModelYear).filter(
    year => year.substring(3) <= currentComplianceYear
  );

  const createAgreement = async (data: AgreementPayload) => {
    "use server";
    const savedAgreement = await saveAgreement(data);
    if (savedAgreement) {
      redirect(Routes.CreditAgreements);
    } else {
      redirect(`${Routes.CreditAgreements}/error`);
    }
  }

  const handleCancel = async () => {
    "use server";
    redirect(Routes.CreditAgreements);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        New Agreement
      </h2>
      <AgreementEditForm
        supplierSelections={supplierSelections}
        modelYearSelections={modelYearSelections}
        zevClassSelections={[ZevClass.A, ZevClass.B]}
        upsertAgreement={createAgreement}
        handleCancel={handleCancel}
      />
    </div>
  );
};

export default Page;
