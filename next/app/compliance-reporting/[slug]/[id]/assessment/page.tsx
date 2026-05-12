// a page that renders the assessment given the myrId

import { AnalystAssessmentActions } from "@/app/compliance-reporting/lib/model-year-reports/components/AnalystAssessmentActions";
import { AssessmentDetails } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentDetails";
import { DirectorActions } from "@/app/compliance-reporting/lib/model-year-reports/components/DirectorActions";
import { MyrSuppBanner } from "@/app/compliance-reporting/lib/model-year-reports/components/MyrSuppBanner";
import { getModelYearReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { JSX } from "react";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  const myr = await getModelYearReport(myrId);
  if (!myr || !myr.assessment) {
    return null;
  }
  if (!userIsGov && myr.status !== ModelYearReportStatus.ASSESSED) {
    return null;
  }

  const status = myr.status;
  let actionComponent: JSX.Element | null = null;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = (
      <AnalystAssessmentActions myrId={myrId} status={myr.status} />
    );
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions myrId={myrId} status={myr.status} />;
  }

  let banner: JSX.Element | null = null;
  if (!userIsGov) {
    banner = (
      <MyrSuppBanner
        type="myr"
        currentTabIndex={4}
        visibleTabIndices={[0, 1, 2, 4, 5]}
        clickableTabs={{
          2: `${Routes.ModelYearReports}/${myrId}`,
          5: `${Routes.ModelYearReports}/${myrId}/reassessments-and-supplementaries`,
        }}
        tabIndicators={{
          0: "prevComplete",
          1: "prevComplete",
          2: "prevComplete",
          4: "currentComplete",
          5: "pending",
        }}
        modelYear={myr.modelYear}
        status={ModelYearReportStatus.ASSESSED}
      />
    );
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    if (
      status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT ||
      status === ModelYearReportStatus.RETURNED_TO_ANALYST
    ) {
      banner = (
        <MyrSuppBanner
          type="myr"
          currentTabIndex={4}
          visibleTabIndices={[2, 3, 4]}
          clickableTabs={{
            2: `${Routes.ModelYearReports}/${myrId}`,
            3: `${Routes.ModelYearReports}/${myrId}/assessment/edit`,
          }}
          tabIndicators={{
            2: "prevComplete",
            3: "prevComplete",
            4: "inProgress",
          }}
          modelYear={myr.modelYear}
          status={status}
        />
      );
    } else if (status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
      banner = (
        <MyrSuppBanner
          type="myr"
          currentTabIndex={4}
          visibleTabIndices={[2, 3, 4]}
          clickableTabs={{
            2: `${Routes.ModelYearReports}/${myrId}`,
          }}
          tabIndicators={{
            2: "prevComplete",
            3: "prevComplete",
            4: "currentComplete",
          }}
          modelYear={myr.modelYear}
          status={status}
        />
      );
    } else if (status === ModelYearReportStatus.ASSESSED) {
      banner = (
        <MyrSuppBanner
          type="myr"
          currentTabIndex={4}
          visibleTabIndices={[2, 3, 4, 5]}
          clickableTabs={{
            2: `${Routes.ModelYearReports}/${myrId}`,
            5: `${Routes.ModelYearReports}/${myrId}/reassessments-and-supplementaries`,
          }}
          tabIndicators={{
            2: "prevComplete",
            3: "prevComplete",
            4: "currentComplete",
            5: "pending",
          }}
          modelYear={myr.modelYear}
          status={status}
        />
      );
    }
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    if (status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
      banner = (
        <MyrSuppBanner
          type="myr"
          currentTabIndex={4}
          visibleTabIndices={[2, 4]}
          clickableTabs={{
            2: `${Routes.ModelYearReports}/${myrId}`,
          }}
          tabIndicators={{
            2: "prevComplete",
            4: "inProgress",
          }}
          modelYear={myr.modelYear}
          status={status}
        />
      );
    } else if (status === ModelYearReportStatus.ASSESSED) {
      banner = (
        <MyrSuppBanner
          type="myr"
          currentTabIndex={4}
          visibleTabIndices={[2, 4, 5]}
          clickableTabs={{
            2: `${Routes.ModelYearReports}/${myrId}`,
            5: `${Routes.ModelYearReports}/${myrId}/reassessments-and-supplementaries`,
          }}
          tabIndicators={{
            2: "prevComplete",
            4: "currentComplete",
            5: "pending",
          }}
          modelYear={myr.modelYear}
          status={status}
        />
      );
    }
  }

  return (
    <div className="flex-flex-col gap-2">
      {banner}
      <AssessmentDetails type="assessment" id={myrId} />
      {actionComponent}
    </div>
  );
};

export default Page;
