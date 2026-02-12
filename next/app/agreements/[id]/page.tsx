import { getUserInfo } from "@/auth";
import { AgreementDetails } from "../lib/components/AgreementDetails";
import { AgreementStatus } from "@/prisma/generated/client";
import { getAgreement } from "../lib/data";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [{ id }, { userRoles }] = await Promise.all([
    props.params,
    getUserInfo(),
  ]);
  const agreementId = Number.parseInt(id);
  const agreement = await getAgreement(agreementId);
  if (!agreement) {
    return null;
  }

  return (
    <div className="p-6">
      <AgreementDetails agreement={agreement} />
    </div>
  );
};

export default Page;
