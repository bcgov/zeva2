import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { Role, ZevClass } from "@/prisma/generated/client";
import { AgreementEditForm } from "../lib/components/AgreementEditForm";
import { AgreementPayload, saveAgreement } from "../lib/action";
import { Attachment } from "@/app/lib/services/attachments";
import { getModelYearSelections, getSupplierSelections } from "../lib/services";

const Page = async () => {
  const { userRoles } = await getUserInfo();
  if (!userRoles.includes(Role.ENGINEER_ANALYST)) {
    return (
      <div className="p-6 font-semibold">
        You do not have access to this page.
      </div>
    );
  }

  const supplierSelectionsPromise = getSupplierSelections();
  const modelYearSelections = getModelYearSelections();

  const createAgreement = async (data: AgreementPayload, files: Attachment[]) => {
    "use server";
    const savedAgreement = await saveAgreement(data, files);
    if (savedAgreement) {
      redirect(`${Routes.CreditAgreements}/${savedAgreement.id}`);
    } else {
      redirect(`${Routes.CreditAgreements}/error`);
    }
  };

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
        supplierSelections={await supplierSelectionsPromise}
        modelYearSelections={modelYearSelections}
        zevClassSelections={[ZevClass.A, ZevClass.B]}
        upsertAgreement={createAgreement}
        handleCancel={handleCancel}
      />
    </div>
  );
};

export default Page;
