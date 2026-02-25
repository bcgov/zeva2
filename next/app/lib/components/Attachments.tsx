"use client";

import { Button } from "@/app/lib/components";
import { useCallback, useState, useTransition } from "react";
import { DataOrErrorActionResponse } from "../utils/actionResponse";
import { downloadMultiple } from "../utils/download";
import { Attachment, AttachmentDownload } from "../constants/attachment";

export const Attachments = (props: {
  attachments: Omit<Attachment, "objectName">[];
  download: () => Promise<DataOrErrorActionResponse<AttachmentDownload[]>>;
  zipName: string;
  className?: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    <div className={props.className}>
      {props.attachments.length === 0 ? (
        <p className="text-sm text-gray-500">No attachments</p>
      ) : (
        <>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {props.attachments.map((attachment, index) => (
              <li key={index}>{attachment.fileName}</li>
            ))}
          </ul>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={isPending}
          >
            {isPending ? "..." : "Download"}
          </Button>
        </>
      )}
    </div>
  );
};
