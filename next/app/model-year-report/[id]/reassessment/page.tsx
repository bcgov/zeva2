import { getUserInfo } from "@/auth";
import { AssessmentForm } from "../../lib/components/AssessmentForm";
import { getLatestReassessment, getModelYearReport } from "../../lib/data";
import {
  ModelYearReportStatus,
  ReassessmentStatus,
} from "@/prisma/generated/client";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const { userIsGov } = await getUserInfo();
  const report = await getModelYearReport(id);
  if (
    !userIsGov ||
    !report ||
    report.status !== ModelYearReportStatus.ASSESSED
  ) {
    return null;
  }
  const latestReassessment = await getLatestReassessment(
    report.organizationId,
    report.modelYear,
  );
  if (
    latestReassessment &&
    latestReassessment.status !== ReassessmentStatus.ISSUED &&
    latestReassessment.status !== ReassessmentStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Reassess a Model Year Report</h1>
      <AssessmentForm
        myrId={report.id}
        orgId={report.organizationId}
        orgName={report.organization.name}
        status={report.status}
        modelYear={report.modelYear}
        isReassessment={true}
      />
    </div>
  );
};

export default Page;
