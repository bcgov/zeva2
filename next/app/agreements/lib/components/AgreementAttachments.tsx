import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getAgreementAttachmentDownloadUrls } from "../action";

export const AgreementAttachments = (props: { id: number }) => {
  const download = () => getAgreementAttachmentDownloadUrls(props.id);
  return (
    <AttachmentsDownload 
      download={download} 
      zipName={`agreement_${props.id}_attachments.zip`} 
    />
  );
};
