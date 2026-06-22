"use client";

import { Button } from "@/app/lib/components";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";

export const VehicleDetailsBackButton = () => {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="secondary"
      icon={<FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />}
      className="w-fit border-primaryBlue bg-white font-semibold text-primaryText hover:border-primaryBlue hover:text-primaryText"
      onClick={() => router.back()}
    >
      Back
    </Button>
  );
};
