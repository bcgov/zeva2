"use client";

import { AuditHistory, IAuditEntry, IAuditSummary } from "@/app/lib/components/audit-history";
import { DropdownOption } from "@/app/lib/components/inputs/Dropdown";

interface VehicleAuditHistoryProps {
  vehicleId: number;
  modelName: string;
  summary?: IAuditSummary;
  entries: IAuditEntry[];
  statusOptions?: DropdownOption[];
  roleOptions?: DropdownOption[];
}

export const VehicleAuditHistory = ({
  vehicleId,
  modelName,
  summary,
  entries,
  statusOptions = [],
  roleOptions = [],
}: VehicleAuditHistoryProps) => {
  const handlePrintDownload = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <AuditHistory
        title={`Audit History for ZEV Model ${modelName}`}
        summary={summary}
        entries={entries}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        onPrintDownload={handlePrintDownload}
      />
    </div>
  );
};
