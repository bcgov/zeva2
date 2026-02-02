import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "../../lib/components/ModelYearReportForm";
import { getModelYearReport } from "../../lib/data";
import { ModelYearReportStatus } from "@/prisma/generated/client";
import { getPresignedGetObjectUrl } from "@/app/lib/minio";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);
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
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Edit a Model Year Report and Forecast Report
      </h1>
      <ModelYearReportForm
        modelYear={myr.modelYear}
        reports={{
          myrUrl: await getPresignedGetObjectUrl(myr.objectName),
          forecast: {
            fileName: myr.forecastReportFileName,
            url: await getPresignedGetObjectUrl(myr.forecastReportObjectName),
          },
        }}
      />
    </div>
  );
};

export default Page;
