import { getUserInfo } from "@/auth";
import { AgreementDetails } from "./AgreementDetails";
import { AgreementStatus, Role } from "@/prisma/generated/enums";
import { getAgreement, getAgreementHistories } from "../data";
import { AnalystActions } from "./AnalystActions";
import { DirectorActions } from "./DirectorActions";
import { getAgreementAttachmentDownloadUrls } from "../actions";
import { Attachments } from "@/app/lib/components/Attachments";
import { StatusBanner } from "@/app/lib/components";
import { getAgreementTypeEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { PrintDownloadPageButton } from "../../credit-transfers/components/PrintDownloadPageButton";
import { BackButton } from "@/app/lib/components/BackButton";

const statusPresentation = {
  [AgreementStatus.DRAFT]: {
    label: "Draft",
    variant: "draft" as const,
    verb: "Saved",
  },
  [AgreementStatus.RECOMMEND_APPROVAL]: {
    label: "Recommended",
    variant: "warning" as const,
    verb: "Recommended for issuance",
  },
  [AgreementStatus.ISSUED]: {
    label: "Issued",
    variant: "success" as const,
    verb: "Issued",
  },
  [AgreementStatus.RETURNED_TO_ANALYST]: {
    label: "Returned",
    variant: "returned" as const,
    verb: "Returned",
  },
};

export const IndividualPage = async (props: { id: string }) => {
  const agreementId = Number.parseInt(props.id, 10);
  const [{ userIsGov, userRoles }, agreement, histories] = await Promise.all([
    getUserInfo(),
    getAgreement(agreementId),
    getAgreementHistories(agreementId),
  ]);
  if (!agreement) return null;
  const status = agreement.status;
  let actions = null;
  if (
    userIsGov &&
    userRoles.includes(Role.ZEVA_IDIR_USER) &&
    (status === AgreementStatus.DRAFT ||
      status === AgreementStatus.RETURNED_TO_ANALYST)
  )
    actions = <AnalystActions agreementId={agreementId} status={status} />;
  else if (
    userIsGov &&
    userRoles.includes(Role.DIRECTOR) &&
    status === AgreementStatus.RECOMMEND_APPROVAL
  )
    actions = <DirectorActions agreementId={agreementId} status={status} />;
  const download = async () => {
    "use server";
    return getAgreementAttachmentDownloadUrls(agreementId);
  };
  const presentation = statusPresentation[status];
  const latestHistory = histories
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .find((history) => history.userAction === status);
  const statusText = latestHistory
    ? `${presentation.verb} ${getIsoYmdString(latestHistory.timestamp)} by ${latestHistory.user.firstName} ${latestHistory.user.lastName}.`
    : `${presentation.verb}.`;
  const typeLabel =
    getAgreementTypeEnumsToStringsMap()[agreement.agreementType];
  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex min-h-20 items-center justify-between rounded-t border border-dividerMedium bg-whisperGray p-5">
        <h1 className="text-2xl font-bold text-black">
          {typeLabel} Credit Agreement ID {agreement.id}
        </h1>
        <PrintDownloadPageButton />
      </header>
      <StatusBanner
        title={`STATUS: ${presentation.label}.`}
        primaryText={statusText}
        variant={presentation.variant}
      />
      <AgreementDetails
        supplier={agreement.organization.name}
        type={agreement.agreementType}
        date={agreement.date}
        content={agreement.agreementContent}
      />
      <section className="overflow-hidden rounded border border-dividerMedium bg-white">
        <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold">
          Supporting Documents (optional)
        </h2>
        <div className="p-5">
          {agreement.agreementAttachment.length ? (
            <Attachments
              attachments={agreement.agreementAttachment}
              download={download}
              zipName={`agreement_${agreementId}_attachments.zip`}
            />
          ) : (
            <p>N/A</p>
          )}
        </div>
      </section>
      {actions ?? (
        <section className="overflow-hidden rounded border border-dividerMedium bg-white">
          <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold">
            Comment (optional)
          </h2>
          <p className="p-5">{latestHistory?.comment ?? "N/A"}</p>
        </section>
      )}
      {!actions && (
        <footer className="flex min-h-20 items-center bg-gray-50 px-5">
          <BackButton />
        </footer>
      )}
    </div>
  );
};
