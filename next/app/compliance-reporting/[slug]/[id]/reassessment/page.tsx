import { getUserInfo } from "@/auth";
import { AssessmentForm } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentForm";
import {
  getModelYearReport,
  getSupplementaryReport,
} from "@/app/compliance-reporting/lib/model-year-reports/data";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { getDataForReassessment } from "@/app/compliance-reporting/lib/model-year-reports/services";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const slug = args.slug;
  const id = Number.parseInt(args.id, 10);
  let report = null;
  if (slug === "legacy-supplementaries") {
    report = await getSupplementaryReport(id);
  } else if (slug === "model-year-reports") {
    report = await getModelYearReport(id);
  }
  if (!report) {
    return null;
  }
  if (
    slug === "legacy-supplementaries" &&
    report.status !== ModelYearReportStatus.RETURNED_TO_ANALYST &&
    report.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT
  ) {
    return null;
  }
  if (
    slug === "model-year-reports" &&
    report.status !== ModelYearReportStatus.ASSESSED
  ) {
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
  if (slug === "legacy-supplementaries") {
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">
          Create an associated Reassessment
        </h1>
        <AssessmentForm
          type="legacyNewSuppReassessment"
          suppId={id}
          orgName={report.organization.name}
          modelYear={report.modelYear}
          orgId={report.organizationId}
        />
      </div>
    );
  } else if (slug === "model-year-reports") {
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Create a Reassessment</h1>
        <AssessmentForm
          type="nonLegacyNewReassessment"
          myrId={id}
          orgName={report.organization.name}
          modelYear={report.modelYear}
          orgId={report.organizationId}
        />
      </div>
    );
  }
  return null;
};

export default Page;
