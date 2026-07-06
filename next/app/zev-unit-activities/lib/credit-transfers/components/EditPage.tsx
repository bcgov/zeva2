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
    <div className="p-4">
      <Breadcrumbs
        items={[
          { label: "Compliance Transactions", href: Routes.CreditTransfers },
          {
            label: `Credit Transfer ID ${creditTransferId}`,
            href: `${Routes.CreditTransfers}/${creditTransferId}`,
          },
          { label: "Edit" },
        ]}
      />
      <h1 className="mb-4 mt-2 text-2xl font-bold text-primaryText">
        Create New Credit Transfer
      </h1>
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
