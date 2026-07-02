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
        className="flex flex-col items-start self-stretch"
      >
        {/* Header — Figma: padding 16px 20px, rounded-t, border #1E5189, bg #EDEBE9 */}
        <div className="flex flex-col items-start self-stretch gap-1 px-5 py-4 rounded-t border border-[#9F9D9C] bg-[#EDEBE9]">
          <span className="self-stretch text-black font-['BC_Sans'] text-base font-bold leading-[22px]">
            {type === "all"
              ? "VIN's Claimed"
              : status === CreditApplicationStatus.APPROVED
                ? "VINs Issued"
                : "VINs to be Issued"}
          </span>
        </div>
        {/* Table body — Figma: border #9F9D9C; th drops border-t so header's blue bottom is the only divider */}
        <div className="overflow-x-auto self-stretch border-b border-l border-r border-[#9F9D9C]">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">MAKE</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">Model Name</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">Model Year</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">Vehicle Class</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">ZEV Class</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">ZEV Type</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">Range</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">Number of Units p...</th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-[#9F9D9C] whitespace-nowrap">Count</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={crypto.randomUUID()} className="odd:bg-[#FAF9F8] even:bg-white">
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{record.make}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{record.modelName}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{modelYearsMap[record.modelYear]}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{vehicleClassesMap[record.vehicleClass]}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{zevClassMap[record.zevClass]}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{record.zevType}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{record.range}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{record.numberOfUnits.toFixed(2)}</td>
                  <td className="px-4 py-3 border-b border-[#9F9D9C] whitespace-nowrap">{record._count.id}</td>
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
        className="self-stretch border border-[#898785] overflow-hidden"
      >
        <div className="px-5 py-3 bg-[#EDEBE9] border-b border-[#898785]">
          <span className="font-bold text-sm">
            {type === "all"
              ? "Credits Claimed"
              : status === CreditApplicationStatus.APPROVED
                ? "Credits Issued"
                : "Credits to be Issued"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-bold">Vehicle Class</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-bold">ZEV Class</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-bold">Model Year</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-bold">Number of Units</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const numberOfUnits = record._sum.numberOfUnits;
                return (
                  <tr key={crypto.randomUUID()}>
                    <td className="border border-gray-300 px-4 py-2">{vehicleClassesMap[record.vehicleClass]}</td>
                    <td className="border border-gray-300 px-4 py-2">{zevClassMap[record.zevClass]}</td>
                    <td className="border border-gray-300 px-4 py-2">{modelYearsMap[record.modelYear]}</td>
                    <td className="border border-gray-300 px-4 py-2">{numberOfUnits ? numberOfUnits.toFixed(2) : "0"}</td>
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
      <div className="flex flex-col items-start self-stretch gap-[26px] p-5">
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
    <div className="flex flex-col items-start self-stretch gap-[26px] p-5">
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
