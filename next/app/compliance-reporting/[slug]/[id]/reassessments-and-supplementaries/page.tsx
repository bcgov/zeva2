import { MyrSuppBanner } from "@/app/compliance-reporting/lib/model-year-reports/components/MyrSuppBanner";
import { ReassessmentsAndSupplementaryReports } from "@/app/compliance-reporting/lib/model-year-reports/components/ReassessmentsAndSupplementaryReports";
import { SupplierAnalystCreateSuppReassessmentActions } from "@/app/compliance-reporting/lib/model-year-reports/components/SupplierAnalystCreateSuppReassessmentActions";
import { getModelYearReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { getDataForReassessment } from "@/app/compliance-reporting/lib/model-year-reports/services";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";
import { JSX } from "react";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const myr = await getModelYearReport(myrId);
  if (!myr || myr.status !== ModelYearReportStatus.ASSESSED) {
    return null;
  }
  const { userIsGov, userRoles } = await getUserInfo();
  let canCreateSupp = false;
  let canCreateReassessment = false;
  if (!userIsGov) {
    canCreateSupp = true;
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    try {
      await getDataForReassessment(myr.organizationId, myr.modelYear);
      canCreateReassessment = true;
    } catch {}
  }
  if (
    (canCreateSupp && canCreateReassessment) ||
    (!canCreateSupp && !canCreateReassessment)
  ) {
    return null;
  }

  let banner: JSX.Element | null = null;
  if (!userIsGov) {
    banner = (
      <MyrSuppBanner
        type="myr"
        currentTabIndex={5}
        visibleTabIndices={[0, 1, 2, 4, 5]}
        clickableTabs={{
          2: `${Routes.ModelYearReports}/${myrId}`,
          4: `${Routes.ModelYearReports}/${myrId}/assessment`,
        }}
        tabIndicators={{
          0: "prevComplete",
          1: "prevComplete",
          2: "prevComplete",
          4: "currentComplete",
          5: "pending",
        }}
        modelYear={myr.modelYear}
      />
    );
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    banner = (
      <MyrSuppBanner
        type="myr"
        currentTabIndex={5}
        visibleTabIndices={[2, 3, 4, 5]}
        clickableTabs={{
          2: `${Routes.ModelYearReports}/${myrId}`,
          4: `${Routes.ModelYearReports}/${myrId}/assessment`,
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
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    banner = (
      <MyrSuppBanner
        type="myr"
        currentTabIndex={5}
        visibleTabIndices={[2, 4, 5]}
        clickableTabs={{
          2: `${Routes.ModelYearReports}/${myrId}`,
          4: `${Routes.ModelYearReports}/${myrId}/assessment`,
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

  return (
    <div className="flex-flex-col gap-2">
      {banner}
      <ReassessmentsAndSupplementaryReports myrId={myrId} />
      <SupplierAnalystCreateSuppReassessmentActions
        type={canCreateSupp ? "supp" : "reassessment"}
        myrId={myrId}
      />
    </div>
  );
};

export default Page;
