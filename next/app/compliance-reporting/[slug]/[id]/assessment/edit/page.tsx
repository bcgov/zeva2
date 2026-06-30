import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AssessmentForm } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentForm";
import { getModelYearReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { getUserInfo } from "@/auth";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { MyrSuppBanner } from "@/app/compliance-reporting/lib/model-year-reports/components/MyrSuppBanner";
import { Routes } from "@/app/lib/constants";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const report = await getModelYearReport(myrId);
  if (
    !report ||
    (report.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      report.status !== ModelYearReportStatus.RETURNED_TO_ANALYST) ||
    !report.assessment
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <MyrSuppBanner
        type="myr"
        currentTabIndex={3}
        visibleTabIndices={[2, 3, 4]}
        clickableTabs={{
          2: `${Routes.ModelYearReports}/${myrId}`,
          ...(report.assessment && {
            4: `${Routes.ModelYearReports}/${myrId}/assessment`,
          }),
        }}
        tabIndicators={{
          2: "prevComplete",
          3: "inProgress",
          4: "pending",
        }}
        modelYear={report.modelYear}
      />
      <AssessmentForm
        type="savedAssessment"
        orgName={report.organization.name}
        modelYear={report.modelYear}
        orgId={report.organizationId}
        myrId={report.id}
        url={await getPresignedGetObjectUrl(report.assessment.objectName)}
      />
    </div>
  );
};

export default Page;
