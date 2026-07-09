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
  variant?: StatusBannerVariant;
}

export type StatusBannerVariant =
  | "info"
  | "draft"
  | "warning"
  | "returned"
  | "success"
  | "error";

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
  returned: {
    container: "border-error bg-white",
    icon: (
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-error" />
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

  if (normalizedTitle.includes("returned")) {
    return "returned";
  }

  if (
    normalizedTitle.includes("rejected") ||
    normalizedTitle.includes("error")
  ) {
    return "error";
  }

  if (
    normalizedTitle.includes("issued") ||
    normalizedTitle.includes("success") ||
    normalizedTitle.includes("validated")
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
  variant,
}: IStatusBannerProps) => {
  let variantToUse = variant;
  if (!variantToUse) {
    variantToUse = getStatusBannerVariant(title);
  }
  const styles = statusBannerStyles[variantToUse];

  return (
    <div
      className={`flex flex-row items-center gap-3 px-4 py-3 rounded-sm border ${styles.container} ${className}`}
    >
      <span className="text-xl">{styles.icon}</span>
      <div className="flex flex-col gap-3">
        <span>
          <span className="font-bold">{title}</span> {primaryText}
        </span>
        {secondaryText && <span className="text-sm">{secondaryText}</span>}
      </div>
    </div>
  );
};
