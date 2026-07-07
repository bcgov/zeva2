import { getUserInfo } from "@/auth";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { CreditTransferForm } from "./CreditTransferForm";
import { getCreditTransfer } from "../data";
import { CreditTransferStatus } from "@/prisma/generated/enums";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";

export const EditPage = async (props: { id: string }) => {
  const creditTransferId = Number.parseInt(props.id, 10);
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const creditTransfer = await getCreditTransfer(creditTransferId);
  if (!creditTransfer || creditTransfer.status !== CreditTransferStatus.DRAFT) {
    return null;
  }
  const transferCandidatesMap = await getOrgsMap(userOrgId, true);
  return (
    <div className="flex self-stretch flex-col items-start gap-4">
      <div className="self-stretch h-px bg-[#898785]"></div>
      <CreditTransferForm
        transferCandidatesMap={transferCandidatesMap}
        creditTransfer={{
          id: creditTransferId,
          transferTo: creditTransfer.transferToId,
          lines: creditTransfer.creditTransferContent.map((record) => {
            return {
              vehicleClass: record.vehicleClass,
              zevClass: record.zevClass,
              modelYear: record.modelYear,
              numberOfUnits: record.numberOfUnits.toFixed(2),
              dollarValuePerUnit: record.dollarValuePerUnit.toFixed(2),
            };
          }),
        }}
      />
    </div>
  );
};
