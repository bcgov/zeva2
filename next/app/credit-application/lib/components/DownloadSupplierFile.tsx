"use client";

import { Button } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { useCallback, useTransition } from "react";
import { getSupplierFileInfo } from "../actions";
import { download } from "@/app/lib/utils/download";

export const DownloadSupplierFile = (props: {
  creditApplicationId: number;
  userIsGov: boolean;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleDownload = useCallback(() => {
    startTransition(async () => {
      try {
        const { url, fileName } = await getSupplierFileInfo(
          props.creditApplicationId,
        );
        await download(url, fileName);
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.creditApplicationId]);

  if (isPending) {
    return <LoadingSkeleton />;
  }
  return (
    <Button onClick={handleDownload}>
      {props.userIsGov
        ? "Download Supplier Submission"
        : "Download Your Submission"}
    </Button>
  );
};
