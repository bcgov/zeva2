import { getCreditTransfer, getCreditTransferHistories } from "../data";
import { getUserInfo } from "@/auth";
import { getCreditTransferStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";
import { ApplicationAuditHistory } from "@/app/zev-unit-activities/lib/credit-applications/components/ApplicationAuditHistory";

export const CreditTransferAuditHistoryContent = async ({
  id,
}: {
  id: number;
}) => {
  const transfer = await getCreditTransfer(id);
  const histories = await getCreditTransferHistories(id);
  const { userIsGov } = await getUserInfo();

  if (!transfer) {
    return <div>Credit Transfer not found</div>;
  }

  const statusMap = getCreditTransferStatusEnumsToStringsMap();

  const { entries, summary, statusOptions, roleOptions } =
    processAuditHistories({
      histories,
      userIsGov,
      statusMap,
    });

  return (
    <ApplicationAuditHistory
      applicationId={id}
      applicationNumber={String(id)}
      summary={summary}
      entries={entries}
      statusOptions={statusOptions}
      roleOptions={roleOptions}
    />
  );
};
