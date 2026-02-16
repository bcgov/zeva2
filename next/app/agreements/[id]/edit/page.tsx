import { getUserInfo } from "@/auth";
import { AgreementStatus, Role } from "@/prisma/generated/enums";
import { AgreementForm } from "../../lib/components/AgreementForm";
import { getAgreement } from "../../lib/data";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { getSerializedAgreementContent } from "../../lib/utilsServer";
import { AttachmentDownload } from "@/app/lib/services/attachments";
import { getAgreementAttachmentDownloadUrls } from "../../lib/actions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [{ id }, { userIsGov, userRoles }] = await Promise.all([
    props.params,
    getUserInfo(),
  ]);
  const agreementId = Number.parseInt(id, 10);
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const agreement = await getAgreement(agreementId);
  if (
    !agreement ||
    (agreement.status !== AgreementStatus.DRAFT &&
      agreement.status !== AgreementStatus.RETURNED_TO_ANALYST)
  ) {
    return null;
  }
  const serializedContent = getSerializedAgreementContent(
    agreement.agreementContent,
  );
  const attachments: AttachmentDownload[] = [];
  const attachmentsResp = await getAgreementAttachmentDownloadUrls(agreementId);
  if (attachmentsResp.responseType === "data") {
    attachments.push(...attachmentsResp.data);
  }
  const orgsMap = await getOrgsMap(null, true);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        Edit an Agreement
      </h2>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <AgreementForm
          type="saved"
          orgsMap={orgsMap}
          agreementId={agreement.id}
          orgId={agreement.organizationId}
          agreementType={agreement.agreementType}
          date={agreement.date}
          content={serializedContent}
          attachments={attachments}
        />
      </div>
    </div>
  );
};

export default Page;
