"use client";

import { ButtonHTMLAttributes, FC, ReactNode } from "react";

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "tertiary";
  size?: "small" | "regular" | "large";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: FC<IButtonProps> = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "regular",
  icon,
  iconPosition = "left",
  disabled = false,
  ...rest
}) => {

  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeStyles = {
    small: "h-8 px-3 text-sm gap-2",
    regular: "h-10 px-4 text-base gap-2",
    large: "h-12 px-5 text-base gap-2",
  };

  const variantStyles = {
    primary: disabled
      ? "bg-disabledBG text-disabledText cursor-not-allowed"
      : "bg-primaryBlue text-white hover:bg-primaryBlueHover active:bg-primaryBluePressed",
    secondary: disabled
      ? "bg-white border-2 border-disabledBG text-disabledText cursor-not-allowed"
      : "bg-white border-2 border-dividerMedium text-primaryText hover:bg-white hover:text-secondaryText active:bg-white active:text-primaryBlue",
    danger: disabled
      ? "bg-disabledBG text-disabledText cursor-not-allowed"
      : "bg-primaryRed text-white hover:bg-primaryRedHover active:bg-primaryRedPressed",
    tertiary: disabled
      ? "bg-transparent text-disabledText cursor-not-allowed"
      : "bg-transparent text-primaryBlue hover:bg-lightGrey active:bg-disabledBG",
  };

  const iconSizeClass = {
    small: "w-4 h-4",
    regular: "w-4 h-4",
    large: "w-6 h-6",
  };

  const buttonClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      disabled={disabled}
      {...rest}
    >
      {icon && iconPosition === "left" && (
        <span className={iconSizeClass[size]}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className={iconSizeClass[size]}>{icon}</span>
      )}
    </button>
  );
};
