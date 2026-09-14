import { AuditHistory } from "@/app/lib/components/audit-history";
import { getPenaltyCreditStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";
import { getUserInfo } from "@/auth";
import { getPenaltyCredit, getPenaltyCreditHistories } from "../data";

export const PenaltyCreditAuditHistoryContent = async ({
  id,
}: {
  id: number;
}) => {
  const [penaltyCredit, histories, { userIsGov }] = await Promise.all([
    getPenaltyCredit(id),
    getPenaltyCreditHistories(id),
    getUserInfo(),
  ]);
  if (!penaltyCredit) return <div>Penalty Credit not found</div>;

  const { entries, summary, statusOptions, roleOptions } =
    processAuditHistories({
      histories,
      userIsGov,
      statusMap: getPenaltyCreditStatusEnumsToStringsMap(),
    });

  return (
    <div className="p-6">
      <AuditHistory
        title={`Audit History for Penalty Credit ${id}`}
        summary={summary}
        entries={entries}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        printable
      />
    </div>
  );
};
