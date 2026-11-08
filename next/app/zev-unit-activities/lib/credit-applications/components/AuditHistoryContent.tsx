import { getApplicationHistories } from "../data";
import { getUserInfo } from "@/auth";
import { getCreditApplicationStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";
import {
  getCreditApplicationGov,
  getCreditApplicationSupplier,
} from "../services";
import { AuditHistory } from "@/app/lib/components/audit-history";

export const AuditHistoryContent = async ({ id }: { id: number }) => {
  const histories = await getApplicationHistories(id);
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let application;
  if (userIsGov) {
    application = await getCreditApplicationGov(id, userRoles);
  } else {
    application = await getCreditApplicationSupplier(id, userOrgId);
  }
  if (!application) {
    return <div>Application not found</div>;
  }

  const statusMap = getCreditApplicationStatusEnumsToStringsMap();

  const { entries, summary, statusOptions, roleOptions } =
    processAuditHistories("creditApplication", {
      histories,
      userIsGov,
      statusMap,
    });

  return (
    <div className="p-6">
      <AuditHistory
        title={`Audit History for Credit Application ${id}`}
        summary={summary}
        entries={entries}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        printable={true}
      />
    </div>
  );
};
