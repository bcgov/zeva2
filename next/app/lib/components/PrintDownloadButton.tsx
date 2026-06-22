"use client";

import { FC, ReactNode } from "react";
import { Button } from "@/app/lib/components";

interface PrintDownloadButtonProps {
  children: ReactNode;
  icon?: ReactNode;
}

export const PrintDownloadButton: FC<PrintDownloadButtonProps> = ({
  children,
  icon,
}) => {
  const handleClick = () => {
    globalThis.print();
  };

  return (
    <Button variant="secondary" onClick={handleClick} icon={icon}>
      {children}
    </Button>
  );
};
