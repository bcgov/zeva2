import { getUserInfo } from "@/auth";
import { AssessmentForm } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentForm";
import { getModelYearReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { getDataForReassessment } from "@/app/compliance-reporting/lib/model-year-reports/services";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return false;
  }
  const report = await getModelYearReport(myrId);
  if (!report || report.status !== ModelYearReportStatus.ASSESSED) {
    return null;
  }
  let createReassessmentPossible = true;
  try {
    await getDataForReassessment(report.organizationId, report.modelYear);
  } catch {
    createReassessmentPossible = false;
  }
  if (!createReassessmentPossible) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Create a Reassessment</h1>
      <AssessmentForm
        type="nonLegacyNewReassessment"
        orgName={report.organization.name}
        modelYear={report.modelYear}
        orgId={report.organizationId}
        myrId={myrId}
      />
    </div>
  );
};

export default Page;
