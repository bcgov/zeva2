"use client";

import { Button } from "@/app/lib/components";
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
        const response = await getSupplierFileInfo(props.creditApplicationId);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const { url, fileName } = response.data;
        await download(url, fileName);
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.creditApplicationId]);

  return (
    <Button onClick={handleDownload} disabled={isPending}>
      {isPending
        ? "..."
        : props.userIsGov
          ? "Download Supplier Submission"
          : "Download Your Submission"}
    </Button>
  );
};
