"use client";

import { ReactNode } from "react";

export interface SelectionCardProps {
  variant: "checkbox" | "radio";
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  accentColor?: string;
  hoverBorderColor?: string;
  titleColor?: string;
  icon?: ReactNode;
  className?: string;
}

export const SelectionCard = ({
  variant,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  name,
  value,
  accentColor = "accent-primaryBlue",
  hoverBorderColor = "hover:border-primaryBlue",
  titleColor,
  icon,
  className = "",
}: SelectionCardProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (variant === "radio") {
      onChange(true);
    } else {
      onChange(e.target.checked);
    }
  };

  return (
    <label
      className={`
        flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors
        ${
          disabled
            ? "cursor-not-allowed border-dividerMedium/40 bg-disabledSurface opacity-60"
            : `border-dividerMedium/60 ${hoverBorderColor}`
        }
        ${checked && !disabled ? "ring-1 ring-primaryBlue ring-offset-0" : ""}
        ${className}
      `}
    >
      <input
        className={`mt-1 h-4 w-4 flex-shrink-0 ${accentColor} ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } focus:ring-2 focus:ring-primaryBlue focus:ring-offset-2`}
        type={variant}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={description ? `${name}-description` : undefined}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <p
            className={`font-semibold ${
              titleColor || "text-primaryText"
            } ${disabled ? "text-secondaryText" : ""}`}
          >
            {title}
          </p>
        </div>
        {description && (
          <p id={`${name}-description`} className="text-sm text-secondaryText">
            {description}
          </p>
        )}
      </div>
    </label>
  );
};
