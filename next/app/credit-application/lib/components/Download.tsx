"use client";

import { useCallback, useState } from "react";
import { Button } from "@/app/lib/components";
import { download } from "@/app/lib/utils/download";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";

export const Download = (props: {
  getDownloadInfo: () =>
    | Promise<string | undefined>
    | Promise<{ fileName: string; url: string } | undefined>;
  fileName?: string;
  text: string;
}) => {
  const [downloadPending, setDownloadPending] = useState(false);
  const onDownload = useCallback(async () => {
    setDownloadPending(true);
    const info = await props.getDownloadInfo();
    if (info) {
      if (typeof info === "string") {
        if (props.fileName) {
          await download(info, props.fileName);
        }
      } else {
        await download(info.url, info.fileName);
      }
    }
    setDownloadPending(false);
  }, [props.getDownloadInfo, props.fileName]);

  if (downloadPending) {
    return <LoadingSkeleton />;
  }
  return <Button onClick={onDownload}>{props.text}</Button>;
};
