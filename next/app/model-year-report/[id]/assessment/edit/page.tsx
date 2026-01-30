import { AssessmentForm } from "@/app/model-year-report/lib/components/AssessmentForm";
import { getModelYearReport } from "@/app/model-year-report/lib/data";
import { getUserInfo } from "@/auth";
import { ModelYearReportStatus } from "@/prisma/generated/client";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const report = await getModelYearReport(myrId, true);
  if (
    !report ||
    (report.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      report.status !== ModelYearReportStatus.RETURNED_TO_ANALYST) ||
    !report.assessment
  ) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit an Assessment</h1>
      <AssessmentForm
        type="assessment"
        orgName={report.organization.name}
        modelYear={report.modelYear}
        orgId={report.organizationId}
        myrId={report.id}
      />
    </div>
  );
};

export default Page;
