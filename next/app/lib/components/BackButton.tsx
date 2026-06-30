"use client";

import { Button } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export const BackButton = (props: { route?: string }) => {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={() => props.route ? router.push(props.route) : router.back()}
      icon={<FontAwesomeIcon icon={faArrowLeft} />}
    >
      Back
    </Button>
  );
};
