"use client";

import { AuditHistory, IAuditEntry, IAuditSummary } from "@/app/lib/components/audit-history";
import { DropdownOption } from "@/app/lib/components/inputs/Dropdown";

interface ApplicationAuditHistoryProps {
  applicationId: number;
  applicationNumber: string;
  summary?: IAuditSummary;
  entries: IAuditEntry[];
  statusOptions?: DropdownOption[];
  roleOptions?: DropdownOption[];
}

export const ApplicationAuditHistory = ({
  applicationId,
  applicationNumber,
  summary,
  entries,
  statusOptions = [],
  roleOptions = [],
}: ApplicationAuditHistoryProps) => {
  const handlePrintDownload = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <AuditHistory
        title={`Audit History for Credit Application ${applicationNumber}`}
        summary={summary}
        entries={entries}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        onPrintDownload={handlePrintDownload}
      />
    </div>
  );
};
