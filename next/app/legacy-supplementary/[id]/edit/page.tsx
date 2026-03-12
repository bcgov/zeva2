import { getUserInfo } from "@/auth";
import { getSupplementaryReport } from "@/app/model-year-report/lib/data";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { ModelYearReportForm } from "@/app/model-year-report/lib/components/ModelYearReportForm";
import { ModelYearReportStatus } from "@/prisma/generated/enums";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const suppId = Number.parseInt(args.id, 10);
  const { userIsGov } = await getUserInfo();
  const report = await getSupplementaryReport(suppId);
  if (userIsGov || !report || report.status !== ModelYearReportStatus.DRAFT) {
    return null;
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
      />
    </div>
  );
};

export default Page;
