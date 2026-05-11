"use client";

import { FC, useState, useMemo } from "react";
import { Button } from "../inputs/Button";
import { Dropdown, DropdownOption } from "../inputs/Dropdown";
import { TextInput } from "../inputs/TextInput";
import { AuditTimeline, IAuditEntry } from "./AuditTimeline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export interface IAuditSummary {
  status?: string;
  finalDecisionDate?: string;
  decisionMaker?: string;
}

export interface IAuditHistoryProps {
  title: string;
  summary?: IAuditSummary;
  entries: IAuditEntry[];
  statusOptions?: DropdownOption[];
  roleOptions?: DropdownOption[];
  onPrintDownload?: () => void;
  customContent?: React.ReactNode;
}

export const AuditHistory: FC<IAuditHistoryProps> = ({
  title,
  summary,
  entries,
  statusOptions = [],
  roleOptions = [],
  onPrintDownload,
  customContent,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    if (statusFilter) {
      filtered = filtered.filter(entry => 
        entry.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(entry => 
        entry.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.status.toLowerCase().includes(query) ||
        entry.reason?.toLowerCase().includes(query) ||
        entry.comment?.toLowerCase().includes(query) ||
        entry.change?.toLowerCase().includes(query) ||
        entry.role?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [entries, statusFilter, roleFilter, searchQuery]);

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-300 rounded-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h1 className="text-xl font-bold">{title}</h1>
          {onPrintDownload && (
            <Button
              variant="secondary"
              size="regular"
              onClick={onPrintDownload}
              icon={<FontAwesomeIcon icon={faDownload} />}
              iconPosition="left"
            >
              Print/Download Page
            </Button>
          )}
        </div>

        {summary && (
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-base font-semibold mb-3">Audit Summary</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {summary.status && (
                <div>
                  <span className="text-gray-700">Status:</span>{" "}
                  <span className="font-semibold text-green-600">{summary.status}</span>
                </div>
              )}
              {summary.finalDecisionDate && (
                <div>
                  <span className="text-gray-700">Final Decision Date:</span>{" "}
                  <span className="font-semibold text-gray-900">{summary.finalDecisionDate}</span>
                </div>
              )}
              {summary.decisionMaker && (
                <div>
                  <span className="text-gray-700">Decision Maker:</span>{" "}
                  <span className="font-semibold text-gray-900">{summary.decisionMaker}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                placeholder="Status"
                options={[{ value: "", label: "Select an option" }, ...statusOptions]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          )}
          {roleOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Dropdown
                placeholder="Role"
                options={[{ value: "", label: "Select an option" }, ...roleOptions]}
                value={roleFilter}
                onChange={setRoleFilter}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <Dropdown
              placeholder="Date"
              options={[
                { value: "", label: "Select an option" },
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
              ]}
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <TextInput
              placeholder="Example text"
              value={searchQuery}
              onChange={setSearchQuery}
              leadingIcon={true}
            />
          </div>
        </div>
      </div>

      {customContent && (
        <div className="mb-6">
          {customContent}
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-md p-6">
        <AuditTimeline entries={filteredEntries} />
      </div>
    </div>
  );
};
