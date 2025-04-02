import { getOrgIdsAndNames } from "../lib/data";
import ZevUnitTransferCreate from "../lib/components/ZevUnitTransferCreate";
import { getUserInfo } from "@/auth";
import { createTransfer, ZevUnitTransferPayload } from "../lib/actions";
import { redirect } from "next/navigation";

const Page = async () => {
  const { userOrgId } = await getUserInfo();
  const transferCandidates = await getOrgIdsAndNames();
  const transferCandidatesMap: { [key: number]: string } = {};
  for (const candidate of transferCandidates) {
    const candidateId = candidate.id;
    if (userOrgId !== candidateId)
      transferCandidatesMap[candidateId] = candidate.name;
  }

  const onSubmit = async (data: ZevUnitTransferPayload) => {
    "use server";
    const createdTransfer = await createTransfer(data);
    if (createdTransfer) {
      const createdTransferId = createdTransfer.id;
      redirect(`/zev-unit-transfer/${createdTransferId}`);
    }
  };

  return (
    <ZevUnitTransferCreate
      transferCandidatesMap={transferCandidatesMap}
      onSubmit={onSubmit}
    />
  );
};

export default Page;
