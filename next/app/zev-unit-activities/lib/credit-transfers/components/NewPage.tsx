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
    <div className="p-4">
      <Breadcrumbs
        items={[
          { label: "Compliance Transactions", href: Routes.CreditTransfers },
          { label: "New Credit Transfer" },
        ]}
      />
      <h1 className="mb-4 mt-2 text-2xl font-bold text-primaryText">
        Create New Credit Transfer
      </h1>
      <CreditTransferForm transferCandidatesMap={transferCandidatesMap} />
    </div>
  );
};
