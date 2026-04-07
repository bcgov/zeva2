"use client";

import { HTMLAttributes, ReactNode, useId } from "react";

export type TooltipPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";

export interface ITooltipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  content: ReactNode;
  placement?: TooltipPlacement;
  tooltipClassName?: string;
  disabled?: boolean;
}

const tooltipPositionClasses: Record<TooltipPlacement, string> = {
  top: "bottom-[calc(100%+0.625rem)] left-1/2 -translate-x-1/2",
  "top-start": "bottom-[calc(100%+0.625rem)] left-0",
  "top-end": "bottom-[calc(100%+0.625rem)] right-0",
  right: "left-[calc(100%+0.625rem)] top-1/2 -translate-y-1/2",
  "right-start": "left-[calc(100%+0.625rem)] top-0",
  "right-end": "left-[calc(100%+0.625rem)] bottom-0",
  bottom: "top-[calc(100%+0.625rem)] left-1/2 -translate-x-1/2",
  "bottom-start": "top-[calc(100%+0.625rem)] left-0",
  "bottom-end": "top-[calc(100%+0.625rem)] right-0",
  left: "right-[calc(100%+0.625rem)] top-1/2 -translate-y-1/2",
  "left-start": "right-[calc(100%+0.625rem)] top-0",
  "left-end": "right-[calc(100%+0.625rem)] bottom-0",
};

const arrowPositionClasses: Record<TooltipPlacement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
  "top-start": "top-full left-4 -translate-y-1/2",
  "top-end": "top-full right-4 -translate-y-1/2",
  right: "right-full top-1/2 translate-x-1/2 -translate-y-1/2",
  "right-start": "right-full top-4 translate-x-1/2",
  "right-end": "right-full bottom-4 translate-x-1/2",
  bottom: "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
  "bottom-start": "bottom-full left-4 translate-y-1/2",
  "bottom-end": "bottom-full right-4 translate-y-1/2",
  left: "left-full top-1/2 -translate-x-1/2 -translate-y-1/2",
  "left-start": "left-full top-4 -translate-x-1/2",
  "left-end": "left-full bottom-4 -translate-x-1/2",
};

export const Tooltip = ({
  children,
  content,
  placement = "top",
  className = "",
  tooltipClassName = "",
  disabled = false,
  ...rest
}: ITooltipProps) => {
  const tooltipId = useId();

  if (disabled || content == null || content === false) {
    return (
      <span className={`inline-flex ${className}`.trim()} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={`group/tooltip relative inline-flex w-fit ${className}`.trim()}
      aria-describedby={tooltipId}
      {...rest}
    >
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none invisible absolute z-50 opacity-0 transition-opacity duration-150 ease-out group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 ${tooltipPositionClasses[placement]}`.trim()}
      >
        <span
          className={`relative block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white shadow-level-4 ${tooltipClassName}`.trim()}
        >
          {content}
          <span
            className={`absolute h-3 w-3 rotate-45 bg-black ${arrowPositionClasses[placement]}`.trim()}
            aria-hidden="true"
          />
        </span>
      </span>
    </span>
  );
};
