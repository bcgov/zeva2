import { JSX } from "react";
import { ParsedForecast } from "../utils";

// todo: create a common table component that doesn't use server side pagination/filters/sorting
// and use it here for the ZEV forecast records
export const ParsedForecastTables = (props: { forecast: ParsedForecast }) => {
  return (
    <div className="flex-col space-y-2">
      <table key="zev" className="w-full text-left">
        <caption className="text-left">ZEV Records</caption>
        <thead>
          <tr>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="make" className="border border-gray-300">
              Make
            </th>
            <th key="model" className="border border-gray-300">
              Model
            </th>
            <th key="type" className="border border-gray-300">
              Type
            </th>
            <th key="range" className="border border-gray-300">
              Range
            </th>
            <th key="zevClass" className="border border-gray-300">
              ZEV Class
            </th>
            <th key="interiorVolume" className="border border-gray-300">
              Interior Volume
            </th>
            <th key="supplyForecast" className="border border-gray-300">
              Supply Forecast
            </th>
          </tr>
        </thead>
        <tbody>
          {props.forecast.zevRecords.map((record) => (
            <tr key={crypto.randomUUID()}>
              <td key="modelYear" className="border border-gray-300">
                {record.modelYear}
              </td>
              <td key="make" className="border border-gray-300">
                {record.make}
              </td>
              <td key="model" className="border border-gray-300">
                {record.model}
              </td>
              <td key="type" className="border border-gray-300">
                {record.type}
              </td>
              <td key="range" className="border border-gray-300">
                {record.range}
              </td>
              <td key="zevClass" className="border border-gray-300">
                {record.zevClass}
              </td>
              <td key="interiorVolume" className="border border-gray-300">
                {record.interiorVolume}
              </td>
              <td key="supplyForecast" className="border border-gray-300">
                {record.supplyForecast}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <table key="nonZev" className="w-full text-left">
        <caption className="text-left">Non-ZEV Records</caption>
        <thead>
          <tr>
            {props.forecast.nonZevRecords.map((record) => (
              <th key={record.modelYear} className="border border-gray-300">
                {record.modelYear}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {props.forecast.nonZevRecords.map((record) => (
              <td key={record.modelYear} className="border border-gray-300">
                {record.supplyForecast}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
