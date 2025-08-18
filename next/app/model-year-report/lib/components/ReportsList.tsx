import { Routes } from "@/app/lib/constants";
import { redirect } from "next/navigation";
import { getModelYearReports } from "../data";
import { ReportsTable } from "./ReportsTable";
import { getSerializedMyrs } from "../utils";
import { getUserInfo } from "@/auth";

export const ReportsList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
  const { userIsGov } = await getUserInfo();
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.ComplianceReporting}/${id}`);
  };
  const [myrs, totalNumberOfMyrs] = await getModelYearReports(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  const serializedMyrs = getSerializedMyrs(myrs, userIsGov);
  return (
    <ReportsTable
      myrs={serializedMyrs}
      totalNumbeOfMyrs={totalNumberOfMyrs}
      navigationAction={navigationAction}
    />
  );
};
