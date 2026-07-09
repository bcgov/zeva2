"use client";

import { Button } from "@/app/lib/components";
import { Fragment, useCallback, useState, useTransition } from "react";
import { DataOrErrorActionResponse } from "../utils/actionResponse";
import { downloadMultiple } from "../utils/download";
import { Attachment, AttachmentDownload } from "../constants/attachment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export const Attachments = (props: {
  attachments: Omit<Attachment, "objectName">[];
  download: () => Promise<DataOrErrorActionResponse<AttachmentDownload[]>>;
  zipName: string;
  includeBottomBorder?: boolean;
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
    <div className="flex flex-col p-5 gap-3">
      {props.attachments.length === 0 ? (
        <span className="text-sm text-gray-500">No attachments</span>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {props.attachments.map((attachment, index) => (
              <Fragment key={index}>
                <span className="text-link underline">
                  {attachment.fileName}
                </span>
                <hr className="border-disabledSurface"></hr>
              </Fragment>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex flex-row justify-between">
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
          </div>
        </>
      )}
      {props.includeBottomBorder && (
        <hr className="border-disabledSurface"></hr>
      )}
    </div>
  );
};
