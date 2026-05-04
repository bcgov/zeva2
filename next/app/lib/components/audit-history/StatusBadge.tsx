"use client";

import { FC } from "react";

export interface IStatusBadgeProps {
  status: string;
  variant?: "approved" | "escalated" | "reviewed" | "updated" | "returned" | "submitted" | "default";
}

export const StatusBadge: FC<IStatusBadgeProps> = ({ status, variant = "default" }) => {
  const variantStyles = {
    approved: "bg-green-700 text-white",
    escalated: "bg-yellow-600 text-white",
    reviewed: "bg-blue-600 text-white",
    updated: "bg-green-700 text-white",
    returned: "bg-red-600 text-white",
    submitted: "bg-gray-600 text-white",
    default: "bg-gray-500 text-white",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold ${variantStyles[variant]}`}
    >
      {status}
    </span>
  );
};
