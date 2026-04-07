import { getUserInfo } from "@/auth";
import { getSupplementaryReport } from "../../model-year-reports/data";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { ModelYearReportForm } from "../../model-year-reports/components/ModelYearReportForm";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getSuppAttachmentDownloadUrls } from "../../model-year-reports/actions";

export const EditPage = async (props: { id: string }) => {
  const suppId = Number.parseInt(props.id, 10);
  const { userIsGov } = await getUserInfo();
  const report = await getSupplementaryReport(suppId);
  if (
    userIsGov ||
    !report ||
    (report.status !== ModelYearReportStatus.DRAFT &&
      report.status !== ModelYearReportStatus.RETURNED_TO_SUPPLIER)
  ) {
    return null;
  }
  const attachments: AttachmentDownload[] = [];
  const attachmentsResp = await getSuppAttachmentDownloadUrls(suppId);
  if (attachmentsResp.responseType === "data") {
    attachments.push(...attachmentsResp.data);
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Edit a Legacy Supplementary Report
      </h1>
      <ModelYearReportForm
        type="legacySavedSupp"
        modelYear={report.modelYear}
        supplementaryId={suppId}
        url={await getPresignedGetObjectUrl(report.objectName)}
        attachments={attachments}
      />
    </div>
  );
};
