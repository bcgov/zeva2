import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getAttachmentDownloadUrls } from "../actions";
import { getAttachmentsCount } from "../data";

export const VehicleAttachments = async (props: { id: number }) => {
  const attachmentsCount = await getAttachmentsCount(props.id);
  if (attachmentsCount === 0) {
    return null;
  }
  const download = async () => {
    "use server";
    return getAttachmentDownloadUrls(props.id);
  };
  return (
    <AttachmentsDownload
      download={download}
      zipName={`zev-model-attachments-${props.id}`}
    />
  );
};
