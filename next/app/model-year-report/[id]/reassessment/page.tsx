import { getUserInfo } from "@/auth";
import { AssessmentForm } from "../../lib/components/AssessmentForm";
import { getModelYearReport } from "../../lib/data";
import { ModelYearReportStatus, Role } from "@/prisma/generated/client";
import { canCreateReassessment } from "../../lib/services";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return false;
  }
  const report = await getModelYearReport(myrId);
  if (!report || report.status !== ModelYearReportStatus.ASSESSED) {
    return null;
  }
  const createReassessmentPossible = await canCreateReassessment(
    myrId,
    userIsGov,
    userRoles,
  );
  if (!createReassessmentPossible) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Create a Reassessment</h1>
      <AssessmentForm
        type="nonLegacyNewReassment"
        orgName={report.organization.name}
        modelYear={report.modelYear}
        orgId={report.organizationId}
      />
    </div>
  );
};

export default Page;
