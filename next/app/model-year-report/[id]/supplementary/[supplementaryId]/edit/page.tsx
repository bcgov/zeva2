import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "@/app/model-year-report/lib/components/ModelYearReportForm";
import { getSupplementaryReport } from "@/app/model-year-report/lib/data";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getSuppAttachmentDownloadUrls } from "@/app/model-year-report/lib/actions";

const Page = async (props: {
  params: Promise<{ id: string; supplementaryId: string }>;
}) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const suppId = Number.parseInt(args.supplementaryId, 10);
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
      <h1 className="text-xl font-bold mb-4">Edit a Supplementary Report</h1>
      <ModelYearReportForm
        type="nonLegacySavedSupp"
        myrId={myrId}
        supplementaryId={suppId}
        modelYear={report.modelYear}
        url={await getPresignedGetObjectUrl(report.objectName)}
        attachments={attachments}
      />
    </div>
  );
};

export default Page;
