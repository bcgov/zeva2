import { getModelYearReports } from "../data";
import { ReportsTable } from "./ReportsTable";
import { getSerializedMyrs } from "../utilsServer";
import { getUserInfo } from "@/auth";
import { ReactNode } from "react";

export const ReportsList = async (props: { headerContent?: ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  const myrs = await getModelYearReports();
  const serializedMyrs = getSerializedMyrs(myrs, userIsGov);
  return (
    <ReportsTable
      myrs={serializedMyrs}
      userIsGov={userIsGov}
      headerContent={props.headerContent}
    />
  );
};
