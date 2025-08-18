import { getUserInfo } from "@/auth";
import { getModelYearReportDetails } from "../data";
import {
  getModelYearEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const ModelYearReportDetails = async (props: { id: number }) => {
  const report = await getModelYearReportDetails(props.id);
  if (!report) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const statusMap = getMyrStatusEnumsToStringsMap();
  return (
    <ul>
      {userIsGov && (
        <li key="supplier">Supplier: {report.organization.name}</li>
      )}
      <li key="modelYear">Model Year: {modelYearsMap[report.modelYear]}</li>
      <li key="status">
        Status:{" "}
        {userIsGov
          ? statusMap[report.status]
          : statusMap[report.supplierStatus]}
      </li>
    </ul>
  );
};
