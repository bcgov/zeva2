"use client";

import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { useEffect, useState, useTransition } from "react";
import { getGovFileDownloadInfo } from "../actions";
import axios from "axios";
import Excel from "exceljs";
import { CreditsPayload, ParsedApplication } from "./ParsedApplication";
import { DirectorActions } from "./DirectorActions";
import { CreditApplicationStatus } from "@/prisma/generated/client";

export const DirectorReview = (props: {
  creditApplicationId: number;
  status: CreditApplicationStatus;
}) => {
  const [isPending, startTransition] = useTransition();
  const [workbook, setWorkbook] = useState<Excel.Workbook | null>(null);
  const [approvedVins, setApprovedVins] = useState<string[] | null>(null);
  const [credits, setCredits] = useState<CreditsPayload | null>(null);
  useEffect(() => {
    startTransition(async () => {
      const fileInfo = await getGovFileDownloadInfo(props.creditApplicationId);
      const response = await axios.get(fileInfo.url, { responseType: "blob" });
      const blob = new Blob([response.data]);
      const workbook = new Excel.Workbook();
      await workbook.xlsx.load(await blob.arrayBuffer());
      setWorkbook(workbook);
    });
  }, []);
  if (isPending || !workbook) {
    return <LoadingSkeleton />;
  }
  return (
    <div>
      <ParsedApplication
        workbook={workbook}
        sendCreditsUpstream={setCredits}
        sendVinsUpstream={setApprovedVins}
      />
      <DirectorActions
        creditApplicationId={props.creditApplicationId}
        status={props.status}
        credits={credits}
        approvedVins={approvedVins}
      />
    </div>
  );
};
