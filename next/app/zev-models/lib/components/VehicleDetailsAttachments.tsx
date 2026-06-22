"use client";

import { Button } from "@/app/lib/components";
import type { AttachmentDownload } from "@/app/lib/constants/attachment";
import type { DataOrErrorActionResponse } from "@/app/lib/utils/actionResponse";
import { downloadMultiple } from "@/app/lib/utils/download";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useState, useTransition } from "react";

type VehicleDetailsAttachmentsProps = {
  attachments: { fileName: string }[];
  download: () => Promise<DataOrErrorActionResponse<AttachmentDownload[]>>;
  zipName: string;
};

export const VehicleDetailsAttachments = ({
  attachments,
  download,
  zipName,
}: VehicleDetailsAttachmentsProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await download();
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        await downloadMultiple(response.data, zipName);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [download, zipName]);

  return (
    <div className="space-y-5">
      {attachments.length === 0 ? (
        <p className="text-sm text-secondaryText">No attachments</p>
      ) : (
        <>
          <div className="space-y-3 border-b border-dividerMedium/30 pb-5">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.fileName}-${index}`}
                className="grid grid-cols-1 gap-2 text-sm md:grid-cols-[12rem_1fr]"
              >
                <span className="text-secondaryText">Proof of Range:</span>
                <span className="text-link underline">{attachment.fileName}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={isPending}
            icon={<FontAwesomeIcon icon={faDownload} />}
            iconPosition="right"
            className="border-primaryBlue bg-white text-sm text-primaryText hover:border-primaryBlue hover:text-primaryText"
          >
            {isPending ? "..." : "Download"}
          </Button>
        </>
      )}
    </div>
  );
};
