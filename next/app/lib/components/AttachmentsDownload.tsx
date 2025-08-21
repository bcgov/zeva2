"use client";

import { Button } from "@/app/lib/components";
import { downloadMultiple } from "@/app/lib/utils/download";
import { useCallback, useState, useTransition } from "react";
import { DataOrErrorActionResponse } from "../utils/actionResponse";
import { AttachmentDownload } from "../services/attachments";

export const AttachmentsDownload = (props: {
  download: () => Promise<DataOrErrorActionResponse<AttachmentDownload[]>>;
  zipName: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const handleDownload = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await props.download();
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        await downloadMultiple(response.data, props.zipName);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.download, props.zipName]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <Button onClick={handleDownload} disabled={isPending}>
        {isPending ? "..." : "Download"}
      </Button>
    </div>
  );
};
