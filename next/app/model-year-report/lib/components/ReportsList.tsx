import { getModelYearReports } from "../data";
import { ReportsTable } from "./ReportsTable";
import { getSerializedMyrs } from "../utilsServer";
import { getUserInfo } from "@/auth";

export const ReportsList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
  const { userIsGov } = await getUserInfo();
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
      userIsGov={userIsGov}
    />
  );
};
