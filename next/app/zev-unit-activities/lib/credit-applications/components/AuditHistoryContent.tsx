import { getCreditApplication, getApplicationHistories } from "../data";
import { ApplicationAuditHistory } from "../components/ApplicationAuditHistory";
import { getUserInfo } from "@/auth";
import { getCreditApplicationStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";

export const AuditHistoryContent = async ({ id }: { id: number }) => {
  const application = await getCreditApplication(id);
  const histories = await getApplicationHistories(id);
  const { userIsGov } = await getUserInfo();
  
  if (!application) {
    return <div>Application not found</div>;
  }

  const statusMap = getCreditApplicationStatusEnumsToStringsMap();

  const { entries, summary, statusOptions, roleOptions } = processAuditHistories({
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
