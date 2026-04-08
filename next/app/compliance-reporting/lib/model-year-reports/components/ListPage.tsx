import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getModelYearReportModelYear } from "@/app/lib/utils/complianceYear";
import { modelYearReportExists } from "../data";
import { ReportsList } from "./ReportsList";

export const ListPage = async () => {
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
    <ReportsList
      headerContent={
        canSubmitReport ? (
          <Link href={`${Routes.ModelYearReports}/new`}>
            <Button variant="primary">Submit a Model Year Report</Button>
          </Link>
        ) : undefined
      }
    />
  );
};
