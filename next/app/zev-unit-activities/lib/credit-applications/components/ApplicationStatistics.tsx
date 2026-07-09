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
      <div
        key={type === "all" ? "allRecords" : "validatedRecords"}
        className="flex flex-col border-t border-l border-r border-disabledIcon rounded-t"
      >
        <div className="flex flex-col px-5 py-4 bg-disabledSurface font-bold">
          {type === "all"
            ? "VIN's Claimed"
            : status === CreditApplicationStatus.APPROVED
              ? "VINs Issued"
              : "VINs to be Issued"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Make
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Model Name
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Model Year
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Vehicle Class
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  ZEV Class
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  ZEV Type
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Range
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Number of Units per Vehicle
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={crypto.randomUUID()}
                  className="odd:bg-lightGrey even:bg-white"
                >
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.make}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.modelName}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {modelYearsMap[record.modelYear]}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {vehicleClassesMap[record.vehicleClass]}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {zevClassMap[record.zevClass]}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.zevType}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.range}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.numberOfUnits.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record._count.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getCreditsTable = (
    records: typeof stats.creditStats,
    type: "all" | "validated",
  ) => {
    return (
      <div
        key={type === "all" ? "allCredits" : "validatedCredits"}
        className="flex flex-col border-t border-l border-r border-disabledIcon rounded-t"
      >
        <div className="flex flex-col px-5 py-4 bg-disabledSurface font-bold">
          {type === "all"
            ? "Credits Claimed"
            : status === CreditApplicationStatus.APPROVED
              ? "Credits Issued"
              : "Credits to be Issued"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Vehicle Class
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  ZEV Class
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Model Year
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Number of Units
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const numberOfUnits = record._sum.numberOfUnits;
                return (
                  <tr
                    key={crypto.randomUUID()}
                    className="odd:bg-lightGrey even:bg-white"
                  >
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {vehicleClassesMap[record.vehicleClass]}
                    </td>
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {zevClassMap[record.zevClass]}
                    </td>
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {modelYearsMap[record.modelYear]}
                    </td>
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {numberOfUnits ? numberOfUnits.toFixed(2) : "0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const recordStatsValidated = stats.recordStatsValidated;
  const creditStatsValidated = stats.creditStatsValidated;

  if (!props.userIsGov) {
    return (
      <div className="flex flex-col gap-6 p-5">
        {stats.recordStats.length > 0 &&
          getRecordsTable(stats.recordStats, "all")}
        {recordStatsValidated &&
          recordStatsValidated.length > 0 &&
          getRecordsTable(recordStatsValidated, "validated")}
        {stats.creditStats.length > 0 &&
          getCreditsTable(stats.creditStats, "all")}
        {creditStatsValidated &&
          creditStatsValidated.length > 0 &&
          getCreditsTable(creditStatsValidated, "validated")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5">
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
