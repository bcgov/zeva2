import {
  unspecifiedComplianceRatios,
  specialComplianceRatios,
} from "@/app/lib/constants/complianceRatio";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

const getComplianceRatiosTable = () => {
  const ratios = unspecifiedComplianceRatios[VehicleClass.REPORTABLE] ?? {};
  const zevClassAData =
    specialComplianceRatios[VehicleClass.REPORTABLE]?.[ZevClass.A] ?? {};

  return (Object.entries(ratios) as [ModelYear, string][]).map(
    ([modelYear, ratio]) => ({
      modelYear,
      complianceRatio: parseFloat(ratio) * 100,
      zevClassA: parseFloat(zevClassAData[modelYear] ?? "0") * 100,
    }),
  );
};

const formatRatio = (value: number) => `${value.toFixed(2)}%`;

const Page = async () => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const rows = getComplianceRatiosTable();

  return (
    <div>
      <h2 className="text-xl font-bold text-primaryText mb-4">
        Compliance Ratios
      </h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-white">
            <th className="text-left px-4 py-3 font-semibold text-gray-900 border border-gray-200">
              Model Year
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 border border-gray-200">
              Compliance Ratio
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900 border border-gray-200">
              ZEV Class A
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.modelYear}
              className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="px-4 py-3 border border-gray-200 text-center">
                {modelYearsMap[row.modelYear]}
              </td>
              <td className="px-4 py-3 border border-gray-200">
                {formatRatio(row.complianceRatio)}
              </td>
              <td className="px-4 py-3 border border-gray-200">
                {formatRatio(row.zevClassA)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
