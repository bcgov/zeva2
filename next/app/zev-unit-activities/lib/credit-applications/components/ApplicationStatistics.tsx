import { CreditApplicationStatus } from "@/prisma/generated/enums";
import { getApplicationStatistics } from "../data";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const ApplicationStatistics = async (props: {
  creditApplicationId: number;
  userIsGov: boolean;
}) => {
  const stats = await getApplicationStatistics(props.creditApplicationId);
  if (!stats) {
    return null;
  }
  const status = stats.status;
  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const getRecordsTable = (
    records: typeof stats.recordStats,
    type: "all" | "validated",
  ) => {
    return (
      <table
        key={type === "all" ? "allRecords" : "validatedRecords"}
        className="w-full text-left"
      >
        <caption className="text-left">
          {type === "all"
            ? "VINs Claimed"
            : status === CreditApplicationStatus.APPROVED
              ? "VINs Issued"
              : "VINs to be Issued"}
        </caption>
        <thead>
          <tr key="headers">
            <th key="make" className="border border-gray-300">
              Make
            </th>
            <th key="modelName" className="border border-gray-300">
              Model Name
            </th>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="vehicleClass" className="border border-gray-300">
              Vehicle Class
            </th>
            <th key="zevClass" className="border border-gray-300">
              ZEV Class
            </th>
            <th key="zevType" className="border border-gray-300">
              ZEV Type
            </th>
            <th key="range" className="border border-gray-300">
              Range
            </th>
            <th key="numberOfUnits" className="border border-gray-300">
              Number of Units Per VIN
            </th>
            <th key="count" className="border border-gray-300">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            return (
              <tr key={crypto.randomUUID()}>
                <td key="make" className="border border-gray-300">
                  {record.make}
                </td>
                <td key="modelName" className="border border-gray-300">
                  {record.modelName}
                </td>
                <td key="modelYear" className="border border-gray-300">
                  {modelYearsMap[record.modelYear]}
                </td>
                <td key="vehicleClass" className="border border-gray-300">
                  {vehicleClassesMap[record.vehicleClass]}
                </td>
                <td key="zevClass" className="border border-gray-300">
                  {zevClassMap[record.zevClass]}
                </td>
                <td key="zevType" className="border border-gray-300">
                  {record.zevType}
                </td>
                <td key="range" className="border border-gray-300">
                  {record.range}
                </td>
                <td key="numberOfUnits" className="border border-gray-300">
                  {record.numberOfUnits.toFixed(2)}
                </td>
                <td key="count" className="border border-gray-300">
                  {record._count.id}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };
  const getCreditsTable = (
    records: typeof stats.creditStats,
    type: "all" | "validated",
  ) => {
    return (
      <table
        key={type === "all" ? "allCredits" : "validatedCredits"}
        className="w-full text-left"
      >
        <caption className="text-left">
          {type === "all"
            ? "Credits Claimed"
            : status === CreditApplicationStatus.APPROVED
              ? "Credits Issued"
              : "Credits to be Issued"}
        </caption>
        <thead>
          <tr key="headers">
            <th key="vehicleClass" className="border border-gray-300">
              Vehicle Class
            </th>
            <th key="zevClass" className="border border-gray-300">
              ZEV Class
            </th>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="numberOfUnits" className="border border-gray-300">
              Number of Units
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const numberOfUnits = record._sum.numberOfUnits;
            return (
              <tr key={crypto.randomUUID()}>
                <td key="vehicleClass" className="border border-gray-300">
                  {vehicleClassesMap[record.vehicleClass]}
                </td>
                <td key="zevClass" className="border border-gray-300">
                  {zevClassMap[record.zevClass]}
                </td>
                <td key="modelYear" className="border border-gray-300">
                  {modelYearsMap[record.modelYear]}
                </td>
                <td key="numberOfUnits" className="border border-gray-300">
                  {numberOfUnits ? numberOfUnits.toFixed(2) : "0"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };
  const recordStatsValidated = stats.recordStatsValidated;
  const creditStatsValidated = stats.creditStatsValidated;
  return (
    <div className="space-y-3">
      {getRecordsTable(stats.recordStats, "all")}
      {recordStatsValidated && recordStatsValidated.length > 0
        ? getRecordsTable(recordStatsValidated, "validated")
        : null}
      {getCreditsTable(stats.creditStats, "all")}
      {creditStatsValidated && creditStatsValidated.length > 0
        ? getCreditsTable(creditStatsValidated, "validated")
        : null}
    </div>
  );
};
