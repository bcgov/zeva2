"use client";

import { Button } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={() => router.back()}
      icon={<FontAwesomeIcon icon={faArrowLeft} />}
    >
      Back
    </Button>
  );
};
