import { getSupplementaryReport } from "../../model-year-reports/data";
import { Supplementary } from "../../model-year-reports/components/Supplementary";

export const IndividualPage = async (props: { id: string }) => {
  const suppId = Number.parseInt(props.id, 10);
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
    />
  );
};
