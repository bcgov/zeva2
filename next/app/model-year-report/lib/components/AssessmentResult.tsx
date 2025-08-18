"use client";

import { useMemo } from "react";
import { ModelYear } from "@/prisma/generated/client";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export type AssessmentResultData = {
  nv?: string;
  transactions: Partial<Record<string, string>>[];
  endingBalance: Partial<Record<string, string>>[];
};

export const AssessmentResult = (props: {
  data?: AssessmentResultData;
  complianceYear: ModelYear;
}) => {
  const newComplianceYear = useMemo(() => {
    const modelYearsMap = getModelYearEnumsToStringsMap();
    const modelYear = modelYearsMap[props.complianceYear];
    if (modelYear) {
      return parseInt(modelYear, 10) + 1;
    }
  }, [props.complianceYear]);

  const transactionsJSX = useMemo(() => {
    return props.data?.transactions.map((transaction) => {
      return (
        <tr key={crypto.randomUUID()}>
          <td key="type">{transaction.type}</td>
          <td key="referenceType">{transaction.referenceType}</td>
          <td key="vehicleClass">{transaction.vehicleClass}</td>
          <td key="zevClass">{transaction.zevClass}</td>
          <td key="modelYear">{transaction.modelYear}</td>
          <td key="numberOfUnits">{transaction.numberOfUnits}</td>
        </tr>
      );
    });
  }, [props.data]);

  const endingBalanceJSX = useMemo(() => {
    return props.data?.endingBalance.map((record) => {
      return (
        <tr key={crypto.randomUUID()}>
          <td key="type">{record.type}</td>
          <td key="vehicleClass">{record.vehicleClass}</td>
          <td key="zevClass">{record.zevClass}</td>
          <td key="modelYear">{record.modelYear}</td>
          <td key="initialNumberOfUnits">{record.initialNumberOfUnits}</td>
          <td key="divisor">{record.divisor}</td>
          <td key="finalNumberOfUnits">{record.finalNumberOfUnits}</td>
        </tr>
      );
    });
  }, [props.data]);

  if (!props.data) {
    return null;
  }
  return (
    <>
      <table key="nv" className="w-full">
        <caption>
          NV that will be used to determine the supplier's average supply volume
        </caption>
        <thead>
          <tr>
            <th>NV</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{props.data.nv}</td>
          </tr>
        </tbody>
      </table>
      <table key="transactions" className="w-full">
        <caption>
          New transactions dated September 30, {newComplianceYear}
        </caption>
        <thead>
          <tr>
            <th key="type">Type</th>
            <th key="referenceType">Reference Type</th>
            <th key="vehicleClass">Vehicle Class</th>
            <th key="zevClass">ZEV Class</th>
            <th key="modelYear">Model Year</th>
            <th key="numberOfUnits">Number of Units</th>
          </tr>
        </thead>
        <tbody>{transactionsJSX}</tbody>
      </table>
      <table key="endingBalance" className="w-full">
        <caption>
          Starting balance for the {newComplianceYear} compliance year
        </caption>
        <thead>
          <tr>
            <th key="type">Type</th>
            <th key="vehicleClass"> Vehicle Class</th>
            <th key="zevClass">ZEV Class</th>
            <th key="modelYear">Model Year</th>
            <th key="initialNumberOfUnits">Initial Number of Units</th>
            <th key="divisor">Divisor</th>
            <th key="finalNumberOfUnits">Final Number of Units</th>
          </tr>
        </thead>
        <tbody>{endingBalanceJSX}</tbody>
      </table>
    </>
  );
};
