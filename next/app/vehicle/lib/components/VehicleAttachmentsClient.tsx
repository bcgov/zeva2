"use client";

import { Button } from "@/app/lib/components";
import { downloadMultiple } from "@/app/lib/utils/download";
import { useCallback, useState, useTransition } from "react";
import { getAttachmentDownloadUrls } from "../actions";

export const VehicleAttachmentsClient = (props: { id: number }) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const handleDownload = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await getAttachmentDownloadUrls(props.id);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const zipName = `zev-model-attachments-${props.id}.zip`;
        await downloadMultiple(response.data, zipName);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.id]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <Button onClick={handleDownload} disabled={isPending}>
        {isPending ? "..." : "Download Attachments"}
      </Button>
    </div>
  );
};
