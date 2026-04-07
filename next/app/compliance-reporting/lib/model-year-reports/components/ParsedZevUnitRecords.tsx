import { FileZevUnitRecord } from "../utils";

export const ParsedZevUnitRecords = (props: {
  caption: string;
  records: FileZevUnitRecord[];
}) => {
  const recordsJSX = props.records.map((record) => {
    return (
      <tr key={crypto.randomUUID()}>
        <td key="type" className="border border-gray-300">
          {record.type}
        </td>
        <td key="vehicleClass" className="border border-gray-300">
          {record.vehicleClass}
        </td>
        <td key="zevClass" className="border border-gray-300">
          {record.zevClass}
        </td>
        <td key="modelYear" className="border border-gray-300">
          {record.modelYear}
        </td>
        <td key="numberOfUnits" className="border border-gray-300">
          {record.numberOfUnits}
        </td>
      </tr>
    );
  });
  return (
    <table className="w-full text-left">
      <caption className="text-left">{props.caption}</caption>
      <thead>
        <tr>
          <th key="type" className="border border-gray-300">
            Type
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
      <tbody>{recordsJSX}</tbody>
    </table>
  );
};
