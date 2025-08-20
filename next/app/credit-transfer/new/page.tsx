import { getUserInfo } from "@/auth";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { CreditTransferForm } from "../lib/components/CreditTransferForm";
import { getCurrentComplianceYear } from "@/app/lib/utils/complianceYear";

const Page = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const transferCandidatesMap = await getOrgsMap(userOrgId, true);
  const currentYear = getCurrentComplianceYear();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Submit a Credit Transfer</h1>
      <CreditTransferForm
        transferCandidatesMap={transferCandidatesMap}
        currentYear={currentYear}
      />
    </div>
  );
};

export default Page;
