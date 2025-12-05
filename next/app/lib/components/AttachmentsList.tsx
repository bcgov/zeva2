"use client";

import { Button } from "@/app/lib/components";
import { useCallback, useState } from "react";
import { Attachment } from "../services/attachments";

export const AttachmentsList = (props: {
  className?: string;
  attachments: Attachment[];
  deleteAttachment?: (objectName: string) => Promise<boolean>;
}) => {
  const [files, setFiles] = useState<Attachment[]>(props.attachments);
  const [deletingAttachmentObj, setDeletingAttachmentObj] = useState<
    string | null
  >(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteAttachment = useCallback(
    async (objectName: string) => {
      if (!props.deleteAttachment) return;
      setDeletingAttachmentObj(objectName);
      setErrorMsg(null);
      const success = await props.deleteAttachment(objectName);
      if (success) {
        setFiles(files.filter((file) => file.objectName !== objectName));
      } else {
        setErrorMsg("An error occurred while deleting the attachment.");
      }
      setDeletingAttachmentObj(null);
    },
    [files],
  );

  return (
    <div className={props.className}>
      {files.length === 0 && (
        <p className="text-sm text-gray-500">No attachments</p>
      )}
      <ul className="list-disc list-inside text-sm text-gray-600">
        {files.map((attachment) => (
          <li key={attachment.objectName}>
            {attachment.fileName}
            {props.deleteAttachment && (
              <Button
                variant="danger"
                size="small"
                onClick={() => handleDeleteAttachment(attachment.objectName)}
                disabled={deletingAttachmentObj !== null}
              >
                {deletingAttachmentObj === attachment.objectName
                  ? "..."
                  : "Delete"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
};
