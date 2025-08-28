import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getAgreementAttachmentDownloadUrls } from "../action";

export const AgreementAttachments = (props: { 
  id: number;
  attachments: { fileName: string }[];
}) => {
  const { id, attachments } = props;
  const download = () => getAgreementAttachmentDownloadUrls(id);
  
  if (attachments.length === 0) {
    return <div>No attachments</div>;
  }

  return (
    <div>
      <div className="mb-3">
        <ul className="list-disc list-inside">
          {attachments.map((attachment, index) => (
            <li key={index} className="text-sm">
              {attachment.fileName}
            </li>
          ))}
        </ul>
      </div>
      <AttachmentsDownload 
        download={download} 
        zipName={`agreement_${id}_attachments.zip`} 
      />
    </div>
  );
};
