import { FileReductionRecord } from "../utils";

export const ParsedComplianceReductions = (props: {
  reductions: FileReductionRecord[];
}) => {
  return (
    <table className="w-full text-left">
      <caption className="text-left">Compliance Reductions</caption>
      <thead>
        <tr>
          <th key="complianceRatio" className="border border-gray-300">
            Compliance Ratio
          </th>
          <th key="nv" className="border border-gray-300">
            NV
          </th>
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
        {props.reductions.map((reduction) => (
          <tr key={crypto.randomUUID()}>
            <td key="complianceRatio" className="border border-gray-300">
              {reduction.ratio}
            </td>
            <td key="nv" className="border border-gray-300">
              {reduction.nv}
            </td>
            <td key="vehicleClass" className="border border-gray-300">
              {reduction.vehicleClass}
            </td>
            <td key="zevClass" className="border border-gray-300">
              {reduction.zevClass}
            </td>
            <td key="modelYear" className="border border-gray-300">
              {reduction.modelYear}
            </td>
            <td key="numberOfUnits" className="border border-gray-300">
              {reduction.numberOfUnits}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
