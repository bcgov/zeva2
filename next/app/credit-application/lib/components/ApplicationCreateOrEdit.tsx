import { getUserInfo } from "@/auth";
import { CreditApplicationForm } from "./CreditApplicationForm";
import { getDocumentDownloadUrls } from "../actions";
import { AttachmentDownload } from "@/app/lib/services/attachments";

export const ApplicationCreateOrEdit = async (props: {
  creditApplicationId?: number;
}) => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  let applicationFile: AttachmentDownload | null = null;
  const attachments: AttachmentDownload[] = [];
  if (props.creditApplicationId) {
    const attachmentsResp = await getDocumentDownloadUrls(
      props.creditApplicationId,
    );
    if (attachmentsResp.responseType === "data") {
      const data = attachmentsResp.data;
      for (const datum of data) {
        if (datum.isApplication) {
          applicationFile = datum;
        } else {
          attachments.push(datum);
        }
      }
    }
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        {props.creditApplicationId ? "Re-upload" : "Submit"} a Credit
        Application
      </h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        {props.creditApplicationId && applicationFile ? (
          <CreditApplicationForm
            creditApplication={{
              id: props.creditApplicationId,
              applicationFile,
              attachments: attachments,
            }}
          />
        ) : (
          <CreditApplicationForm />
        )}
      </div>
    </div>
  );
};
