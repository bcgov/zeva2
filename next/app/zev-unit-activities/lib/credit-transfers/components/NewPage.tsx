import { getUserInfo } from "@/auth";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { CreditTransferForm } from "./CreditTransferForm";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";

export const NewPage = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const transferCandidatesMap = await getOrgsMap(userOrgId, true);
  return (
    <div className="flex self-stretch flex-col items-start gap-4">
      <div className="flex items-center gap-3">
        <Breadcrumbs
          items={[
            { label: "Compliance Transactions", href: Routes.CreditTransfers },
            { label: "New Credit Transfer" },
          ]}
        />
      </div>
      <div className="flex flex-col items-start gap-4 self-stretch bg-white">
        <div className="flex flex-col items-start gap-4 self-stretch">
          <div className="flex flex-col items-start gap-2">
            <div className="font-bold text-2xl leading-[34px] text-secondaryText">
              Create New Credit Transfer
            </div>
          </div>
        </div>
      </div>
      <div className="self-stretch h-px bg-dividerMedium"></div>
      <CreditTransferForm transferCandidatesMap={transferCandidatesMap} />
    </div>
  );
};
