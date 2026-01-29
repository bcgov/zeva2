"use client";

import { Row } from "@/app/lib/components/layout";
import { Routes } from "@/app/lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const Navbar = (props: {
  creditApplicationId: string;
  slug: "validated" | "model-name-mismatches";
}) => {
  const searchParams = useSearchParams();
  return (
    <Row className="px-1 space-x-1">
      <Link
        key={"records"}
        className={
          props.slug === "validated" ? "border-b-2 border-primaryYellow" : ""
        }
        href={`${Routes.CreditApplication}/${props.creditApplicationId}/validated?${searchParams.toString()}`}
      >
        All Records
      </Link>
      <Link
        key={"mismatches"}
        className={
          props.slug === "model-name-mismatches"
            ? "border-b-2 border-primaryYellow"
            : ""
        }
        href={`${Routes.CreditApplication}/${props.creditApplicationId}/model-name-mismatches?${searchParams.toString()}`}
      >
        Review Model Mismatches
      </Link>
    </Row>
  );
};
