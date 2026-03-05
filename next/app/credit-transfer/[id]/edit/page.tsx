import { getUserInfo } from "@/auth";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { CreditTransferForm } from "../../lib/components/CreditTransferForm";
import { getCreditTransfer } from "../../lib/data";
import { CreditTransferStatus } from "@/prisma/generated/enums";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const creditTransferId = Number.parseInt(args.id, 10);
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
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Submit a Credit Transfer</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
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
    </div>
  );
};

export default Page;
