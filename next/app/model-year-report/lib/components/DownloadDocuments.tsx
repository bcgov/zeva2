"use client";

import { Button } from "@/app/lib/components";
import { useCallback, useState, useTransition } from "react";
import { getDocumentDownloadUrls } from "../actions";
import { downloadMultiple } from "@/app/lib/utils/download";

export const DownloadDocuments = (props: { id: number }) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const handleDownload = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await getDocumentDownloadUrls(props.id);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const { documents, zipName } = response.data;
        await downloadMultiple(documents, zipName);
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
        {isPending ? "..." : "Download Documents"}
      </Button>
    </div>
  );
};
