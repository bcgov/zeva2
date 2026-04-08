import { JSX } from "react";
import { getModelMismatchesMap } from "../data";

export const ModelNameMismatches = async (props: {
  creditApplicationId: number;
}) => {
  const mismatchesMap = await getModelMismatchesMap(props.creditApplicationId);
  const rows: JSX.Element[] = [];
  Object.entries(mismatchesMap).forEach(([modelName, map], index) => {
    if (map) {
      rows.push(
        <tr key={modelName}>
          <td className="border border-gray-300">{index + 1}</td>
          <td className="border border-gray-300">{modelName}</td>
          <td className="border border-gray-300">
            <ul>
              {Object.keys(map).map((icbcModelName) => (
                <li key={icbcModelName}>{icbcModelName}</li>
              ))}
            </ul>
          </td>
          <td className="border border-gray-300">
            <ul>
              {Object.values(map).map((count, index) => (
                <li key={index}>{count}</li>
              ))}
            </ul>
          </td>
        </tr>,
      );
    }
  });
  return (
    <table>
      <thead>
        <tr>
          <th className="border border-gray-300">Index</th>
          <th className="border border-gray-300">Submitted Model Name</th>
          <th className="border border-gray-300">ICBC Model Name</th>
          <th className="border border-gray-300">Count</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
