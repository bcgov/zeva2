"use client";

import Decimal from "decimal.js";
import {
  ComplianceNumbers,
  CreditBalance,
  EstimatedModelSale,
  SupplierSize,
} from "../types";

type CalculatorTotalsProps = {
  complianceNumbers: ComplianceNumbers;
  supplierSize: SupplierSize;
  estimatedModelSales: EstimatedModelSale[];
  creditBalance: CreditBalance;
};

const formatNumeric = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const CalculatorTotals = ({
  complianceNumbers,
  supplierSize,
  estimatedModelSales,
  creditBalance,
}: CalculatorTotalsProps) => {
  const estimatedClassATotal = estimatedModelSales
    .filter((sale) => sale.creditClass === "A")
    .reduce((sum, sale) => sum.plus(sale.value), new Decimal(0))
    .toNumber();

  const estimatedClassBTotal = estimatedModelSales
    .filter((sale) => sale.creditClass === "B")
    .reduce((sum, sale) => sum.plus(sale.value), new Decimal(0))
    .toNumber();

  const hasEstimates = complianceNumbers.total !== "";

  return (
    <div className="col-span-1 lg:col-span-4 bg-lightGrey border border-calculatorStroke rounded p-4">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-base font-bold text-primaryText">
            <h3>Estimated Compliance Ratio Reduction:</h3>
            <span>{hasEstimates ? complianceNumbers.total : "..."}</span>
          </div>
          {supplierSize === "large" && hasEstimates && (
            <div className="mt-2 space-y-1 text-sm text-secondaryText">
              <div className="flex justify-between">
                <span>-ZEV Class A Debit:</span>
                <span className="text-right">{complianceNumbers.classA}</span>
              </div>
              <div className="flex justify-between">
                <span>-Unspecified ZEV Class Debit:</span>
                <span className="text-right">
                  {complianceNumbers.remaining}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-calculatorStroke pt-4">
          <h3 className="text-sm text-primaryText mb-3">
            Current credit balance:
          </h3>
          <div className="space-y-3 text-sm text-primaryText">
            <div className="flex justify-between">
              <span className="font-bold">Class A Credit Total:</span>
              <span className="text-right">
                {formatNumeric(creditBalance.A)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Class B Credit Total:</span>
              <span className="text-right">
                {formatNumeric(creditBalance.B)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-calculatorStroke pt-4">
          <h3 className="text-sm text-primaryText mb-3">
            Estimated Annual ZEVs Supplied (from below):
          </h3>
          <div className="space-y-3 text-sm text-primaryText">
            <div className="flex justify-between">
              <span className="font-bold">Estimated Class A Credit Total:</span>
              <span className="text-right">
                {formatNumeric(estimatedClassATotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Estimated Class B Credit Total:</span>
              <span className="text-right">
                {formatNumeric(estimatedClassBTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
