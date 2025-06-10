import { JSX } from "react";
import { CreditApplicationCredit } from "../data";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const ApplicationCredits = (props: {
  credits: CreditApplicationCredit[];
}) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const rows: JSX.Element[] = [];
  let counter = 0;
  props.credits.forEach((credit) => {
    rows.push(
      <tr key={counter}>
        <th key="vehicleClass">{credit.vehicleClass}</th>
        <th key="zevClass">{credit.zevClass}</th>
        <th key="modelYear">{modelYearsMap[credit.modelYear]}</th>
        <th key="numberOfCredits">{credit.numberOfUnits.toString()}</th>
      </tr>,
    );
    counter = counter + 1;
  });
  if (rows.length === 0) {
    return null;
  }
  return (
    <table>
      <tbody>
        <tr key="headers">
          <th key="vehicleClass">Vehicle Class</th>
          <th key="zevClass">ZEV Class</th>
          <th key="modelYear">Model Year</th>
          <th key="numberOfCredits">Number of Units</th>
        </tr>
        {rows}
      </tbody>
    </table>
  );
};
