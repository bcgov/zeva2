import { getUserInfo } from "@/auth";
import { AgreementDetails } from "../lib/components/AgreementDetails";
import { Role } from "@/prisma/generated/client";
import { getAgreement } from "../lib/data";
import { AnalystActions } from "../lib/components/AnalystActions";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AttachmentsList } from "@/app/lib/components/AttachmentsList";
import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getAgreementAttachmentDownloadUrls } from "../lib/actions";
import { Attachment } from "@/app/lib/services/attachments";
import { AgreementHistory } from "../lib/components/AgreementHistory";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [{ id }, { userIsGov, userRoles }] = await Promise.all([
    props.params,
    getUserInfo(),
  ]);
  const agreementId = Number.parseInt(id, 10);
  const agreement = await getAgreement(agreementId);
  if (!agreement) {
    return null;
  }
  const status = agreement.status;
  let actions;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actions = <AnalystActions agreementId={agreementId} status={status} />;
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actions = <DirectorActions agreementId={agreementId} status={status} />;
  }
  const attachments: Attachment[] = [];
  for (const att of agreement.agreementAttachment) {
    if (att.fileName) {
      attachments.push({
        fileName: att.fileName,
        objectName: crypto.randomUUID(),
      });
    }
  }
  const download = async () => {
    "use server";
    return getAgreementAttachmentDownloadUrls(agreementId);
  };

  return (
    <div className="p-6">
      <AgreementHistory agreementId={agreementId} />
      <AgreementDetails
        id={agreement.id}
        supplier={agreement.organization.name}
        type={agreement.agreementType}
        status={status}
        date={agreement.date}
        content={agreement.agreementContent}
      />
      <div className="mt-4">
        <p className={"py-1 font-semibold text-primaryBlue"}>
          Supporting Documents
        </p>
        <div className={"p-2 border border-gray-300 rounded bg-white"}>
          <AttachmentsList className="mb-3" attachments={attachments} />
          {attachments.length > 0 && (
            <AttachmentsDownload
              download={download}
              zipName={`agreement_${agreementId}_attachments.zip`}
            />
          )}
        </div>
      </div>
      {actions}
    </div>
  );
};

export default Page;
