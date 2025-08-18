"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const SupplierActions = (props: {
  id: number;
  status: ModelYearReportStatus;
}) => {
  const router = useRouter();

  const handleGoToResubmit = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.id}/resubmit`);
  }, [props.id, router]);

  if (props.status !== ModelYearReportStatus.RETURNED_TO_SUPPLIER) {
    return null;
  }
  return (
    <div className="space-y-2">
      <Button onClick={handleGoToResubmit}>Resubmit Reports</Button>
    </div>
  );
};
