import { getOrgsMap } from "../lib/data";
import ZevUnitTransferCreateOrSave from "../lib/components/ZevUnitTransferCreateOrSave";
import { getUserInfo } from "@/auth";
import { createTransfer, ZevUnitTransferPayload } from "../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";

const Page = async () => {
  const { userOrgId } = await getUserInfo();
  const transferCandidatesMap = await getOrgsMap(userOrgId, true);

  const onCreate = async (data: ZevUnitTransferPayload) => {
    "use server";
    const createdTransfer = await createTransfer(data);
    if (createdTransfer) {
      const createdTransferId = createdTransfer.id;
      redirect(`${Routes.CreditTransactions}/${createdTransferId}`);
    }
  };

  return (
    <ZevUnitTransferCreateOrSave
      type="create"
      transferCandidatesMap={transferCandidatesMap}
      initialTransferTo={parseInt(Object.keys(transferCandidatesMap)[0])}
      initialContent={[]}
      onCreateOrSave={onCreate}
    />
  );
};

export default Page;
