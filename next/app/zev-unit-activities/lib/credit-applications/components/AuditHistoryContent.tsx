import { getCreditApplication, getApplicationHistories } from "../data";
import { ApplicationAuditHistory } from "../components/ApplicationAuditHistory";
import { getUserInfo } from "@/auth";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getCreditApplicationStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { IAuditEntry, IAuditSummary } from "@/app/lib/components/audit-history";

const getStatusVariant = (status: string): IAuditEntry["statusVariant"] => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("approved") || lowerStatus.includes("validated")) return "approved";
  if (lowerStatus.includes("escalated") || lowerStatus.includes("review")) return "escalated";
  if (lowerStatus.includes("reviewed")) return "reviewed";
  if (lowerStatus.includes("updated") || lowerStatus.includes("submitted")) return "submitted";
  if (lowerStatus.includes("returned") || lowerStatus.includes("rejected")) return "returned";
  return "default";
};

export const AuditHistoryContent = async ({ id }: { id: number }) => {
  const application = await getCreditApplication(id);
  const histories = await getApplicationHistories(id);
  const { userIsGov } = await getUserInfo();
  
  if (!application) {
    return <div>Application not found</div>;
  }

  const statusMap = getCreditApplicationStatusEnumsToStringsMap();

  const entries: IAuditEntry[] = histories.map((history) => {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }

    const status = statusMap[history.userAction] || history.userAction;
    
    return {
      id: history.id,
      timestamp: `${getIsoYmdString(history.timestamp)}, ${getTimeWithTz(history.timestamp)}`,
      actor: name,
      role: name,
      status: status,
      statusVariant: getStatusVariant(status),
      comment: history.comment || undefined,
    };
  });

  const approvedEntry = entries
    .slice()
    .reverse()
    .find(entry => entry.statusVariant === "approved");

  const summary: IAuditSummary | undefined = approvedEntry ? {
    status: approvedEntry.status,
    finalDecisionDate: approvedEntry.timestamp.split(",")[0],
    decisionMaker: approvedEntry.role,
  } : undefined;

  const statusOptions = Array.from(new Set(entries.map(e => e.status)))
    .map(status => ({ value: status, label: status }));
  
  const roleOptions = Array.from(new Set(entries.map(e => e.role).filter(Boolean)))
    .map(role => ({ value: role!, label: role! }));

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
