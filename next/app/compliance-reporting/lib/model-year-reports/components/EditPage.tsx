import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "./ModelYearReportForm";
import { getModelYearReport, getSupplierOwnData } from "../data";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getMyrAttachmentDownloadUrls } from "../actions";
import { MyrSuppBanner } from "./MyrSuppBanner";
import { Routes } from "@/app/lib/constants";
import { ReportGenerationInfo } from "./ReportGenerationInfo";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

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
  const myrMap = getModelYearEnumsToStringsMap();
  const attachments: AttachmentDownload[] = [];
  const attachmentsResp = await getMyrAttachmentDownloadUrls(myrId);
  if (attachmentsResp.responseType === "data") {
    attachments.push(...attachmentsResp.data);
  }
  return (
    <div className="flex flex-col gap-4 p-2">
      <SecondaryNavbar
        items={[
          {
            label: `Model Year Report ${myrMap[myr.modelYear]}`,
            route: `${Routes.ModelYearReports}/${myrId}/edit`,
          },
          {
            label: "Audit History",
            route: `${Routes.ModelYearReports}/${myrId}/audit-history?modelYear=${myrMap[myr.modelYear]}&detailsType=edit`,
          },
        ]}
        activeIndex={0}
      />
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
        bottomBanner={<ReportGenerationInfo modelYear={myr.modelYear} />}
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
