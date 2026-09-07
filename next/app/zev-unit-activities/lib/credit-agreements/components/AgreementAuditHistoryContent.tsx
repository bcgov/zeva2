import { getUserInfo } from "@/auth";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";
import { getAgreementStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { AuditHistory } from "@/app/lib/components/audit-history";
import { getAgreement, getAgreementHistories } from "../data";

export const AgreementAuditHistoryContent = async ({ id }: { id: number }) => {
  const [agreement, histories, { userIsGov }] = await Promise.all([
    getAgreement(id),
    getAgreementHistories(id),
    getUserInfo(),
  ]);

  if (!agreement) return <div>Credit Agreement not found</div>;

  const { entries, summary, statusOptions, roleOptions } =
    processAuditHistories({
      histories,
      userIsGov,
      statusMap: getAgreementStatusEnumsToStringsMap(),
    });

  return (
    <div className="p-6">
      <AuditHistory
        title={`Audit History for Credit Agreement ${id}`}
        summary={summary}
        entries={entries}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        printable
      />
    </div>
  );
};
