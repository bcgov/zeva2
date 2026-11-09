import { getCreditTransfer, getCreditTransferHistories } from "../data";
import { getUserInfo } from "@/auth";
import { getCreditTransferStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";
import { AuditHistory } from "@/app/lib/components/audit-history";

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
    processAuditHistories("transfer", {
      histories,
      userIsGov,
      statusMap,
    });

  return (
    <div className="p-6">
      <AuditHistory
        title={`Audit History for Credit Transfer ${id}`}
        summary={summary}
        entries={entries}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        printable={true}
      />
    </div>
  );
};
