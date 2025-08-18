"use client";

import { ButtonHTMLAttributes, FC } from "react";

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: FC<IButtonProps> = ({
  children,
  onClick,
  className = "",
  ...rest
}) => {
  return (
    <button onClick={onClick} className={className} {...rest}>
      {children}
    </button>
  );
};
