import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getDownloadUrls } from "../actions";

export const ApplicationDownloads = async (props: { id: number }) => {
  const download = async () => {
    "use server";
    return getDownloadUrls(props.id);
  };
  return (
    <AttachmentsDownload
      download={download}
      zipName={`credit-application-documents-${props.id}.zip`}
    />
  );
};
