import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "../../lib/components/ModelYearReportForm";
import { getModelYearReport } from "../../lib/data";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getMyrAttachmentDownloadUrls } from "../../lib/actions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const myr = await getModelYearReport(myrId);
  if (
    !myr ||
    (myr.status !== ModelYearReportStatus.DRAFT &&
      myr.status !== ModelYearReportStatus.RETURNED_TO_SUPPLIER)
  ) {
    return null;
  }
  const attachments: AttachmentDownload[] = [];
  const attachmentsResp = await getMyrAttachmentDownloadUrls(myrId);
  if (attachmentsResp.responseType === "data") {
    attachments.push(...attachmentsResp.data);
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Edit a Model Year Report and Forecast Report
      </h1>
      <ModelYearReportForm
        type="savedMyr"
        myrId={myrId}
        modelYear={myr.modelYear}
        myrUrl={await getPresignedGetObjectUrl(myr.objectName)}
        forecast={{
          fileName: myr.forecastReportFileName,
          url: await getPresignedGetObjectUrl(myr.forecastReportObjectName),
        }}
        attachments={attachments}
      />
    </div>
  );
};

export default Page;
