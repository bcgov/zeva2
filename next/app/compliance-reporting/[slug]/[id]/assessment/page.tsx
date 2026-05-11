// a page that renders the assessment given the myrId

import { AnalystAssessmentActions } from "@/app/compliance-reporting/lib/model-year-reports/components/AnalystAssessmentActions";
import { AssessmentDetails } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentDetails";
import { DirectorActions } from "@/app/compliance-reporting/lib/model-year-reports/components/DirectorActions";
import { getModelYearReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { getUserInfo } from "@/auth";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { JSX } from "react";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  const myr = await getModelYearReport(myrId);
  if (!myr) {
    return null;
  }
  if (!userIsGov && myr.status !== ModelYearReportStatus.ASSESSED) {
    return null;
  }

  let actionComponent: JSX.Element | null = null;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = (
      <AnalystAssessmentActions myrId={myrId} status={myr.status} />
    );
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions myrId={myrId} status={myr.status} />;
  }

  return (
    <div className="flex-flex-col gap-2">
      <AssessmentDetails type="assessment" id={myrId} />
      {actionComponent}
    </div>
  );
};

export default Page;
