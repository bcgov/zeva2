import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getDocumentDownloadUrls } from "../actions";
import { getAttachmentsCount } from "../data";

export const CreditApplicationAttachments = async (props: {
  creditApplicationId: number;
}) => {
  const attachmentsCount = await getAttachmentsCount(props.creditApplicationId);
  const totalDocumentsCount = attachmentsCount + 1;
  const download = async () => {
    "use server";
    return getDocumentDownloadUrls(props.creditApplicationId);
  };
  return (
    <div className="space-y-3">
      <span>Number of attachments: {totalDocumentsCount}</span>
      <AttachmentsDownload
        download={download}
        zipName={`credit-application-attachments-${props.creditApplicationId}`}
      />
    </div>
  );
};
