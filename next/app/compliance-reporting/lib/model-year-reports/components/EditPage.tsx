import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "./ModelYearReportForm";
import { getModelYearReport, getSupplierOwnData } from "../data";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getMyrAttachmentDownloadUrls } from "../actions";
import { MyrSuppBanner } from "./MyrSuppBanner";
import { Routes } from "@/app/lib/constants";

export const EditPage = async (props: { id: string }) => {
  const myrId = Number.parseInt(props.id, 10);
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const { mostRecentSupplierClass } = await getSupplierOwnData();
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
    <div className="flex flex-col gap-4 p-2">
      <MyrSuppBanner
        type="myr"
        currentTabIndex={0}
        visibleTabIndices={[0, 1, 2, 4]}
        clickableTabs={{
          1: `${Routes.ModelYearReports}/${myr.id}`,
        }}
        tabIndicators={{
          0: "inProgress",
          1: "pending",
          2: "pending",
          4: "disabled",
        }}
        modelYear={myr.modelYear}
        statusBanner={{
          variant: "warning",
          title: "STATUS - Draft",
        }}
        includeGenerationinfo={true}
      />
      <ModelYearReportForm
        type="savedMyr"
        mostRecentSupplierClass={mostRecentSupplierClass}
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
