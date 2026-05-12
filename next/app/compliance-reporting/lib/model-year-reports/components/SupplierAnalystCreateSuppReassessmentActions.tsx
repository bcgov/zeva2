"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

export const SupplierAnalystCreateSuppReassessmentActions = (props: {
  type: "supp" | "reassessment";
  myrId: number;
}) => {
  const router = useRouter();

  const handleGoToCreate = useCallback(() => {
    if (props.type === "supp") {
      router.push(`${Routes.ModelYearReports}/${props.myrId}/supplementary`);
    } else if (props.type === "reassessment") {
      router.push(`${Routes.ModelYearReports}/${props.myrId}/reassessment`);
    }
  }, [props.type, props.myrId]);

  const label = useMemo(() => {
    if (props.type === "supp") {
      return "Create Supplementary Report";
    } else if (props.type === "reassessment") {
      return "Create Reassessment";
    }
  }, [props.type]);

  return (
    <div className="flex flex-row p-2 bg-gray-50 justify-between">
      <span></span>
      <Button onClick={handleGoToCreate} variant="primary">
        {label}
      </Button>
    </div>
  );
};
