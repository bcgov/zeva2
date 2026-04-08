"use client";

import { Routes } from "@/app/lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const Navbar = (props: {
  creditApplicationId: string;
  slug: "validated" | "model-name-mismatches";
}) => {
  const searchParams = useSearchParams();
  return (
    <div className="mb-4 flex gap-2 border-b border-gray-400">
      <Link
        key={"records"}
        className={`px-4 py-2.5 text-sm -mb-px rounded-t ${props.slug === "validated" ? "border-t border-l border-r border-gray-400 border-b-white bg-white text-black" : "border-t border-l border-r border-gray-300 border-b-gray-400 text-[#255A90] hover:bg-[#F7F9FC]"}`}
        href={`${Routes.CreditApplications}/${props.creditApplicationId}/validated?${searchParams.toString()}`}
      >
        All Records
      </Link>
      <Link
        key={"mismatches"}
        className={`px-4 py-2.5 text-sm -mb-px rounded-t ${props.slug === "model-name-mismatches" ? "border-t border-l border-r border-gray-400 border-b-white bg-white text-black" : "border-t border-l border-r border-gray-300 border-b-gray-400 text-[#255A90] hover:bg-[#F7F9FC]"}`}
        href={`${Routes.CreditApplications}/${props.creditApplicationId}/model-name-mismatches?${searchParams.toString()}`}
      >
        Review Model Mismatches
      </Link>
    </div>
  );
};
