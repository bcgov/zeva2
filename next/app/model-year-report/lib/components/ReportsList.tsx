import { getModelYearReports } from "../data";
import { ReportsTable } from "./ReportsTable";
import { getSerializedMyrs } from "../utilsServer";
import { getUserInfo } from "@/auth";

export const ReportsList = async () => {
  const { userIsGov } = await getUserInfo();
  const myrs = await getModelYearReports();
  const serializedMyrs = getSerializedMyrs(myrs, userIsGov);
  return <ReportsTable myrs={serializedMyrs} userIsGov={userIsGov} />;
};
