import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { ZevClass } from "@/prisma/generated/client";
import { AgreementPayload, saveAgreement } from "../../lib/action";
import {
  getAgreementDetails,
  getModelYearSelections,
  getSupplierSelections,
} from "../../lib/services";
import { AgreementEditForm } from "../../lib/components/AgreementEditForm";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [{ id }, { userIsGov }] = await Promise.all([
    props.params,
    getUserInfo(),
  ]);
  const agreementId = parseInt(id);

  const [agreementDetails, supplierSelections] =
    isNaN(agreementId) || !userIsGov
      ? [null, []]
      : await Promise.all([
          getAgreementDetails(agreementId),
          getSupplierSelections(),
        ]);
  if (!agreementDetails) {
    return (
      <div className="p-6 font-semibold">
        Invalid agreement ID or you do not have access to it.
      </div>
    );
  }

  const modelYearSelections = getModelYearSelections();

  const updateAgreement = async (data: AgreementPayload) => {
    "use server";
    const savedAgreement = await saveAgreement(data, agreementId);
    if (savedAgreement) {
      redirect(`${Routes.CreditAgreements}/${id}`);
    } else {
      redirect(`${Routes.CreditAgreements}/error`);
    }
  };

  const handleCancel = async () => {
    "use server";
    redirect(`${Routes.CreditAgreements}/${id}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        Edit Agreement
      </h2>
      <AgreementEditForm
        supplierSelections={supplierSelections}
        modelYearSelections={modelYearSelections}
        zevClassSelections={[ZevClass.A, ZevClass.B]}
        agreementDetails={agreementDetails}
        upsertAgreement={updateAgreement}
        handleCancel={handleCancel}
      />
    </div>
  );
};

export default Page;
