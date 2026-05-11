"use client";

import { FC } from "react";
import { StatusBadge } from "./StatusBadge";

export interface IAuditEntry {
  id: string | number;
  timestamp: string;
  actor: string;
  role?: string;
  status: string;
  statusVariant?: "approved" | "escalated" | "reviewed" | "updated" | "returned" | "submitted" | "default";
  reason?: string;
  comment?: string;
  attachment?: {
    name: string;
    url: string;
    size?: string;
  };
  change?: string;
}

export interface IAuditTimelineProps {
  entries: IAuditEntry[];
}

export const AuditTimeline: FC<IAuditTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No history entries found.
      </div>
    );
  }

  const getLineColor = (variant?: IAuditEntry["statusVariant"]) => {
    switch (variant) {
      case "approved":
      case "updated":
        return "border-green-700";
      case "escalated":
        return "border-yellow-600";
      case "reviewed":
        return "border-blue-600";
      case "returned":
        return "border-red-600";
      case "submitted":
        return "border-gray-600";
      default:
        return "border-gray-500";
    }
  };

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => (
        <div key={entry.id}>
          <div className="flex gap-3 pb-4">
            <div className="flex flex-col items-center pt-1">
              <div className={`w-0 h-full min-h-[100px] border-l-2 border-dashed ${getLineColor(entry.statusVariant)}`}></div>
            </div>

            <div className="flex-1">
              <div className="flex gap-6">
                <div className="min-w-[140px]">
                  <div className="text-sm text-gray-900 font-medium">
                    {entry.timestamp}
                  </div>
                  {entry.role && (
                    <div className="text-sm text-gray-700">
                      By: <span className="font-medium">{entry.role}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-3">
                    <StatusBadge 
                      status={entry.status} 
                      variant={entry.statusVariant}
                    />
                  </div>

                  {entry.attachment && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Attachment:</span>{" "}
                      <a
                        href={entry.attachment.url}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {entry.attachment.name}
                      </a>
                      {entry.attachment.size && (
                        <span className="text-gray-600 ml-1">{entry.attachment.size}</span>
                      )}
                    </div>
                  )}

                  {entry.comment && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Comment:</span>{" "}
                      <span className="text-gray-900">"{entry.comment}"</span>
                    </div>
                  )}

                  {entry.reason && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Reason:</span>{" "}
                      <span className="text-gray-900">{entry.reason}</span>
                    </div>
                  )}

                  {entry.change && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Change:</span>{" "}
                      <span className="text-gray-900">{entry.change}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {index < entries.length - 1 && (
            <div className="border-b border-gray-300 my-4"></div>
          )}
        </div>
      ))}
    </div>
  );
};
