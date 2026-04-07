import { getSupplementaryReport } from "@/app/model-year-report/lib/data";
import { Supplementary } from "@/app/model-year-report/lib/components/Supplementary";

const Page = async (props: {
  params: Promise<{ id: string; supplementaryId: string }>;
}) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const suppId = Number.parseInt(args.supplementaryId, 10);
  const report = await getSupplementaryReport(suppId);
  if (!report) {
    return null;
  }
  return (
    <Supplementary
      suppId={suppId}
      orgName={report.organization.name}
      modelYear={report.modelYear}
      status={report.status}
      suppReassessmentExists={!!report.supplementaryReportReassessment}
      attachments={report.supplementaryReportAttachments}
      myrId={myrId}
    />
  );
};

export default Page;
