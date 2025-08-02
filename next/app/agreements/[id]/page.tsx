import { getUserInfo } from "@/auth";
import { AgreementDetails } from "../lib/components/AgreementDetails";
import { getAgreementDetails } from "../lib/services";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [{ id }, { userIsGov }] = await Promise.all([props.params, getUserInfo()]);
  const agreementId = parseInt(id);
  const agreement = isNaN(agreementId)
    ? null
    : await getAgreementDetails(agreementId);
  if (!agreement) {
    return (
      <div className="p-6 font-semibold">
        Invalid agreement ID or you do not have access to it.
      </div>
    );
  }

  return (
    <div className="p-6">
      <AgreementDetails
        agreement={agreement}
        userIsGov={userIsGov}
      />
    </div>
  );
};

export default Page;
