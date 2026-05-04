import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { IAuditEntry, IAuditSummary } from "@/app/lib/components/audit-history";

export const getStatusVariant = (status: string): IAuditEntry["statusVariant"] => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("approved") || lowerStatus.includes("validated")) return "approved";
  if (lowerStatus.includes("escalated") || lowerStatus.includes("review")) return "escalated";
  if (lowerStatus.includes("reviewed")) return "reviewed";
  if (lowerStatus.includes("updated") || lowerStatus.includes("submitted")) return "submitted";
  if (lowerStatus.includes("returned") || lowerStatus.includes("rejected")) return "returned";
  return "default";
};

interface HistoryRecord {
  id: number;
  timestamp: Date;
  userAction: string;
  comment?: string | null;
  user: {
    firstName: string;
    lastName: string;
    organization: {
      isGovernment: boolean;
    };
  };
}

interface ProcessAuditHistoriesParams {
  histories: HistoryRecord[];
  userIsGov: boolean;
  statusMap: Record<string, string>;
}

interface ProcessedAuditData {
  entries: IAuditEntry[];
  summary: IAuditSummary | undefined;
  statusOptions: { value: string; label: string }[];
  roleOptions: { value: string; label: string }[];
}

export const processAuditHistories = (params: ProcessAuditHistoriesParams): ProcessedAuditData => {
  const { histories, userIsGov, statusMap } = params;

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

  return {
    entries,
    summary,
    statusOptions,
    roleOptions,
  };
};
