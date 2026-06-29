import { getUserInfo } from "@/auth";
import { AssessmentForm } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentForm";
import { getModelYearReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { MyrSuppBanner } from "@/app/compliance-reporting/lib/model-year-reports/components/MyrSuppBanner";
import { Routes } from "@/app/lib/constants";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  const report = await getModelYearReport(id);
  if (
    !userIsGov ||
    !userRoles.includes(Role.ZEVA_IDIR_USER) ||
    !report ||
    (report.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      report.status !== ModelYearReportStatus.RETURNED_TO_ANALYST) ||
    report.assessment
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
          2: `${Routes.ModelYearReports}/${id}`,
        }}
        tabIndicators={{
          2: "prevComplete",
          3: "inProgress",
          4: "pending",
        }}
        modelYear={report.modelYear}
      />
      <AssessmentForm
        type="newAssessment"
        orgName={report.organization.name}
        orgId={report.organizationId}
        myrId={report.id}
        modelYear={report.modelYear}
        url={await getPresignedGetObjectUrl(report.objectName)}
      />
    </div>
  );
};

export default Page;
