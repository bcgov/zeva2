import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import { getModelYearReportModelYear } from "../lib/utils/complianceYear";
import { modelYearReportExists } from "./lib/data";
import { ReportsList } from "./lib/components/ReportsList";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  let canSubmitReport = false;
  if (!userIsGov) {
    const modelYear = getModelYearReportModelYear();
    const reportExists = await modelYearReportExists(modelYear);
    if (!reportExists) {
      canSubmitReport = true;
    }
  }
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <ReportsList
        headerContent={
          canSubmitReport ? (
            <Link href={`${Routes.ComplianceReporting}/new`}>
              <Button variant="primary">Submit a Model Year Report</Button>
            </Link>
          ) : undefined
        }
      />
    </Suspense>
  );
};

export default Page;
