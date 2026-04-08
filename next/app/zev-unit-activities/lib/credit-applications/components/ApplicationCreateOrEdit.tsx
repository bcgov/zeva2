import { getUserInfo } from "@/auth";
import { CreditApplicationForm } from "./CreditApplicationForm";
import { getCreditApplicationAttachmentDownloadUrls } from "../actions";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getOrgInfo } from "../services";
import { getCreditApplication } from "../data";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";

export const ApplicationCreateOrEdit = async (props: {
  creditApplicationId?: number;
}) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  let legalName;
  let serviceAddress;
  let recordsAddress;
  let makes;
  let applicationFile: AttachmentDownload | null = null;
  let attachments: AttachmentDownload[] = [];
  if (props.creditApplicationId) {
    const [application, attachmentsResp] = await Promise.all([
      getCreditApplication(props.creditApplicationId),
      getCreditApplicationAttachmentDownloadUrls(props.creditApplicationId),
    ]);
    if (!application) {
      return null;
    }
    applicationFile = {
      url: await getPresignedGetObjectUrl(application.objectName),
      fileName: application.fileName,
    };
    legalName = application.legalName;
    recordsAddress = application.recordsAddress;
    serviceAddress = application.serviceAddress;
    makes = application.makes;
    if (attachmentsResp.responseType === "data") {
      attachments = attachmentsResp.data;
    }
  } else {
    const orgInfo = await getOrgInfo(userOrgId);
    legalName = orgInfo.name;
    recordsAddress = orgInfo.recordsAddress;
    serviceAddress = orgInfo.serviceAddress;
    makes = orgInfo.makes;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        {props.creditApplicationId ? "Edit" : "Create"} a Credit Application
      </h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        {props.creditApplicationId && applicationFile ? (
          <CreditApplicationForm
            legalName={legalName}
            recordsAddress={recordsAddress}
            serviceAddress={serviceAddress}
            makes={makes}
            creditApplication={{
              id: props.creditApplicationId,
              applicationFile,
              attachments: attachments,
            }}
          />
        ) : (
          <CreditApplicationForm
            legalName={legalName}
            recordsAddress={recordsAddress}
            serviceAddress={serviceAddress}
            makes={makes}
          />
        )}
      </div>
    </div>
  );
};
