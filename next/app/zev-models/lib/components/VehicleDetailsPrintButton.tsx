"use client";

import { Button } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export const VehicleDetailsPrintButton = () => {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => window.print()}
      icon={<FontAwesomeIcon icon={faDownload} />}
      className="border-primaryBlue bg-white text-sm font-semibold text-primaryText hover:border-primaryBlue hover:text-primaryText"
    >
      Print/Download Page
    </Button>
  );
};
