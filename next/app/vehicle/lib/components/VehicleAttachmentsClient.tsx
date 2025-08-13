"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { downloadZip } from "@/app/lib/utils/download";
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
        const fileNames: string[] = [];
        const urls: string[] = [];
        response.data.forEach((obj) => {
          fileNames.push(obj.fileName);
          urls.push(obj.url);
        });
        const files = await Promise.all(
          urls.map((url) => {
            return axios.get(url, {
              responseType: "arraybuffer",
            });
          }),
        );
        const payload: { fileName: string; data: ArrayBuffer }[] = [];
        files.forEach((file, index) => {
          payload.push({
            fileName: fileNames[index],
            data: file.data,
          });
        });
        await downloadZip(`zev-model-attachments-${props.id}.zip`, payload);
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
