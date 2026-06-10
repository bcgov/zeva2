import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ReportsList } from "./ReportsList";
import { getMyrModelYear } from "../data";

export const ListPage = async () => {
  const { userIsGov } = await getUserInfo();
  let canSubmitReport = false;
  if (!userIsGov) {
    const modelYear = await getMyrModelYear();
    if (modelYear) {
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
