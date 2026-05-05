"use client";

import type { HTMLAttributes, JSX, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faCircleInfo,
  faFilePen,
  faSquareCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export interface IStatusBannerProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  primaryText: ReactNode;
  secondaryText?: ReactNode;
}

type StatusBannerVariant = "info" | "draft" | "warning" | "success" | "error";

const statusBannerStyles: Record<
  StatusBannerVariant,
  { container: string; icon: JSX.Element }
> = {
  info: {
    container: "border-info bg-white",
    icon: <FontAwesomeIcon icon={faCircleInfo} className="text-info" />,
  },
  draft: {
    container: "border-info bg-white",
    icon: <FontAwesomeIcon icon={faFilePen} className="text-info" />,
  },
  warning: {
    container: "border-warning bg-[#FFF4D8]",
    icon: (
      <FontAwesomeIcon icon={faCircleExclamation} className="text-warning" />
    ),
  },
  success: {
    container: "border-success bg-[#F0FAF2]",
    icon: <FontAwesomeIcon icon={faSquareCheck} className="text-success" />,
  },
  error: {
    container: "border-error bg-white",
    icon: (
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-error" />
    ),
  },
};

function getStatusBannerVariant(title: string): StatusBannerVariant {
  const normalizedTitle = title.toLowerCase();

  if (
    normalizedTitle.includes("rejected") ||
    normalizedTitle.includes("error")
  ) {
    return "error";
  }

  if (
    normalizedTitle.includes("issued") ||
    normalizedTitle.includes("success")
  ) {
    return "success";
  }

  if (
    normalizedTitle.includes("submitted") ||
    normalizedTitle.includes("warning")
  ) {
    return "warning";
  }

  if (normalizedTitle.includes("draft")) {
    return "draft";
  }

  return "info";
}

export const StatusBanner = ({
  title,
  primaryText,
  secondaryText,
  className = "",
  ...rest
}: IStatusBannerProps) => {
  const variant = getStatusBannerVariant(title);
  const styles = statusBannerStyles[variant];

  return (
    <div
      className={`w-full rounded-sm border px-4 py-3 text-primaryText ${styles.container} ${className}`}
      role="status"
      {...rest}
    >
      <div className="flex gap-3">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-xl">
          {styles.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base leading-6">
            <span className="font-bold">{title}</span>
            <span>{primaryText}</span>
          </div>
          {secondaryText && (
            <div className="mt-2 text-sm leading-5">{secondaryText}</div>
          )}
        </div>
      </div>
    </div>
  );
};
