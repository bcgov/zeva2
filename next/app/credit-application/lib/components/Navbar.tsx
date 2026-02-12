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
    <div className="mb-4 flex gap-2 border-b">
      <Link
        key={"records"}
        className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${props.slug === "validated" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-900"}`}
        href={`${Routes.CreditApplication}/${props.creditApplicationId}/validated?${searchParams.toString()}`}
      >
        All Records
      </Link>
      <Link
        key={"mismatches"}
        className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${props.slug === "model-name-mismatches" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-900"}`}
        href={`${Routes.CreditApplication}/${props.creditApplicationId}/model-name-mismatches?${searchParams.toString()}`}
      >
        Review Model Mismatches
      </Link>
    </div>
  );
};
