import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import { getModelYearReportModelYear } from "../lib/utils/complianceYear";
import { modelYearReportExists } from "./lib/data";
import { ReportsList } from "./lib/components/ReportsList";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov } = await getUserInfo();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  let canSubmitReport = false;
  if (!userIsGov) {
    const modelYear = getModelYearReportModelYear();
    if (modelYear) {
      const reportExists = await modelYearReportExists(modelYear);
      if (!reportExists) {
        canSubmitReport = true;
      }
    }
  }

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {canSubmitReport && (
        <Link href={`${Routes.ComplianceReporting}/new`}>
          <Button>Submit a Report</Button>
        </Link>
      )}
      <ReportsList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
