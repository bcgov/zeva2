"use client";

import { Button } from "@/app/lib/components";
import { useCallback, useState, useTransition } from "react";
import { DataOrErrorActionResponse } from "../utils/actionResponse";
import { downloadMultiple } from "../utils/download";
import { Attachment, AttachmentDownload } from "../constants/attachment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export const Attachments = (props: {
  attachments: Omit<Attachment, "objectName">[];
  download: () => Promise<DataOrErrorActionResponse<AttachmentDownload[]>>;
  zipName: string;
  className?: string;
  label?: string;
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
          <ul className="flex flex-col self-stretch">
            {props.attachments.map((attachment, index) => (
              <li key={index} className="flex flex-col">
                <div className="py-3">
                  {props.label && (
                    <span className="text-[#474543] font-['BC_Sans'] text-base leading-6">
                      {props.label}
                    </span>
                  )}
                  <span className="text-[#255A90] font-['BC_Sans'] text-base leading-6 underline">
                    {attachment.fileName}
                  </span>
                </div>
                <div className="self-stretch h-px bg-[#EDEBE9]" />
              </li>
            ))}
          </ul>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={isPending}
            icon={<FontAwesomeIcon icon={faDownload} />}
            iconPosition="right"
          >
            {isPending
              ? "..."
              : props.attachments.length > 1
                ? "Download All"
                : "Download"}
          </Button>
        </>
      )}
    </div>
  );
};
