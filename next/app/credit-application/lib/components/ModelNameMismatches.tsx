import { JSX } from "react";
import { getModelMismatchesMap } from "../data";
import { randomUUID } from "crypto";

export const ModelNameMismatches = async (props: {
  creditApplicationId: number;
}) => {
  const mismatchesMap = await getModelMismatchesMap(props.creditApplicationId);
  const rows: JSX.Element[] = [];
  Object.entries(mismatchesMap).forEach(([modelName, map], index) => {
    if (map) {
      rows.push(
        <tr key={modelName}>
          <td key="rowNumber">{index + 1}</td>
          <td key="submittedModelName">{modelName}</td>
          <td key="icbcModelName">
            <ul>
              {Object.keys(map).map((icbcModelName) => (
                <li key={icbcModelName}>{icbcModelName}</li>
              ))}
            </ul>
          </td>
          <td key="count">
            <ul>
              {Object.values(map).map((count) => (
                <li key={randomUUID()}>{count}</li>
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
          <th></th>
          <th>Submitted Model Name</th>
          <th>ICBC Model Name</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
