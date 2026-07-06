import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { ModelYearReportDetails } from "./ModelYearReportDetails";
import { getModelYearReport } from "../data";
import { SupplierActions } from "./SupplierActions";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { AnalystMyrActions } from "./AnalystMyrActions";
import { ForecastReportDetails } from "./ForecastReportDetails";
import { mapOfStatusToSupplierStatus } from "../constants";
import { MyrSuppBanner } from "./MyrSuppBanner";
import { Routes } from "@/app/lib/constants";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const IndividualPage = async (props: { id: string }) => {
  const myrId = Number.parseInt(props.id, 10);
  const myr = await getModelYearReport(myrId);
  if (!myr) {
    return null;
  }
  const myrMap = getModelYearEnumsToStringsMap();
  const { userIsGov, userRoles } = await getUserInfo();
  const status = userIsGov
    ? myr.status
    : mapOfStatusToSupplierStatus[myr.status];
  let actionComponent: JSX.Element | null = null;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = (
      <AnalystMyrActions
        myrId={myrId}
        status={status}
        assessmentExists={!!myr.assessment}
      />
    );
  } else if (!userIsGov) {
    actionComponent = (
      <SupplierActions
        myrId={myrId}
        status={status}
        modelYear={myr.modelYear}
        supplierName={myr.organization.name}
      />
    );
  }

  let banner: JSX.Element | null = null;
  if (!userIsGov) {
    if (
      status === ModelYearReportStatus.DRAFT ||
      status === ModelYearReportStatus.RETURNED_TO_SUPPLIER
    ) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[0, 1, 2, 4]}
          currentTabIndex={1}
          clickableTabs={{
            0: `${Routes.ModelYearReports}/${myrId}/edit`,
          }}
          tabIndicators={{
            0: "prevComplete",
            1: "inProgress",
            2: "pending",
            4: "disabled",
          }}
          modelYear={myr.modelYear}
          statusBanner={{
            variant: "warning",
            title: `STATUS - ${status === ModelYearReportStatus.DRAFT ? "Draft" : "Returned To Supplier"}.`,
          }}
        />
      );
    } else if (status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[0, 1, 2, 4]}
          currentTabIndex={2}
          clickableTabs={{}}
          tabIndicators={{
            0: "prevComplete",
            1: "prevComplete",
            2: "currentComplete",
            4: "disabled",
          }}
          modelYear={myr.modelYear}
          statusBanner={{
            variant: "success",
            title: "Report Submitted Successfully.",
            primaryText:
              "Your report is now under review. You will be notified once the assessment is complete",
          }}
        />
      );
    } else if (status === ModelYearReportStatus.ASSESSED) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[0, 1, 2, 4, 5]}
          currentTabIndex={2}
          clickableTabs={{
            4: `${Routes.ModelYearReports}/${myrId}/assessment`,
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
          statusBanner={{
            variant: "success",
            title: "Report Assessed.",
          }}
        />
      );
    }
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    if (
      status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT ||
      status === ModelYearReportStatus.RETURNED_TO_ANALYST
    ) {
      const assessmentExists = !!myr.assessment;
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[2, 3, 4]}
          currentTabIndex={2}
          clickableTabs={{
            3: `${Routes.ModelYearReports}/${myrId}/assessment/${assessmentExists ? "edit" : "new"}`,
            ...(assessmentExists && {
              4: `${Routes.ModelYearReports}/${myrId}/assessment`,
            }),
          }}
          tabIndicators={{
            2: "prevComplete",
            3: "inProgress",
            4: assessmentExists ? "pending" : "disabled",
          }}
          modelYear={myr.modelYear}
        />
      );
    } else if (status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[2, 3, 4]}
          currentTabIndex={2}
          clickableTabs={{
            4: `${Routes.ModelYearReports}/${myrId}/assessment`,
          }}
          tabIndicators={{
            2: "prevComplete",
            3: "prevComplete",
            4: "currentComplete",
          }}
          modelYear={myr.modelYear}
        />
      );
    } else if (status === ModelYearReportStatus.ASSESSED) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[2, 3, 4, 5]}
          currentTabIndex={2}
          clickableTabs={{
            4: `${Routes.ModelYearReports}/${myrId}/assessment`,
            5: `${Routes.ModelYearReports}/${myrId}/reassessments-and-supplementaries`,
          }}
          tabIndicators={{
            2: "prevComplete",
            3: "prevComplete",
            4: "currentComplete",
            5: "pending",
          }}
          modelYear={myr.modelYear}
        />
      );
    }
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    if (status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[2, 4]}
          currentTabIndex={2}
          clickableTabs={{
            4: `${Routes.ModelYearReports}/${myrId}/assessment`,
          }}
          tabIndicators={{
            2: "prevComplete",
            4: "inProgress",
          }}
          modelYear={myr.modelYear}
        />
      );
    } else if (status === ModelYearReportStatus.ASSESSED) {
      banner = (
        <MyrSuppBanner
          type="myr"
          visibleTabIndices={[2, 4, 5]}
          currentTabIndex={2}
          clickableTabs={{
            4: `${Routes.ModelYearReports}/${myrId}/assessment`,
            5: `${Routes.ModelYearReports}/${myrId}/reassessments-and-supplementaries`,
          }}
          tabIndicators={{
            2: "prevComplete",
            4: "currentComplete",
            5: "pending",
          }}
          modelYear={myr.modelYear}
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SecondaryNavbar
        items={[
          {
            label: `Model Year Report ${myrMap[myr.modelYear]}`,
            route: `${Routes.ModelYearReports}/${myrId}`,
          },
          {
            label: `Audit History`,
            route: `${Routes.ModelYearReports}/${myrId}/audit-history?modelYear=${myrMap[myr.modelYear]}&detailsType=myr`,
          },
        ]}
        activeIndex={0}
      />
      {banner}
      <Suspense fallback={<LoadingSkeleton />}>
        <ModelYearReportDetails id={myrId} />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <ForecastReportDetails myrId={myrId} />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
    </div>
  );
};
