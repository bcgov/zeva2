"use client";

import { ComplianceNumbers, CreditBalance, EstimatedModelSale, SupplierSize } from "../types";

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
    .reduce((sum, sale) => sum + sale.value, 0);

  const estimatedClassBTotal = estimatedModelSales
    .filter((sale) => sale.creditClass === "B")
    .reduce((sum, sale) => sum + sale.value, 0);

  const hasEstimates = complianceNumbers.total !== "";

  return (
    <div className="col-span-1 lg:col-span-4 bg-white border border-dividerMedium rounded shadow-level-1 p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-primaryText mb-2">
            Estimated Compliance Ratio Reduction:
          </h3>
          <div className="text-right text-primaryText">
            {hasEstimates ? complianceNumbers.total : "..."}
          </div>
          {supplierSize === "large" && hasEstimates && (
            <div className="mt-2 space-y-1 text-sm text-secondaryText">
              <div className="flex justify-between">
                <span>-ZEV Class A Debit:</span>
                <span className="text-right">{complianceNumbers.classA}</span>
              </div>
              <div className="flex justify-between">
                <span>-Unspecified ZEV Class Debit:</span>
                <span className="text-right">{complianceNumbers.remaining}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-dividerMedium pt-4">
          <h3 className="text-base font-semibold text-primaryText mb-2">
            Current credit balance:
          </h3>
          <div className="space-y-1 text-sm text-primaryText">
            <div className="flex justify-between">
              <span>Class A Credit Total:</span>
              <span className="text-right">{formatNumeric(creditBalance.A)}</span>
            </div>
            <div className="flex justify-between">
              <span>Class B Credit Total:</span>
              <span className="text-right">{formatNumeric(creditBalance.B)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-dividerMedium pt-4">
          <h3 className="text-base font-semibold text-primaryText mb-2">
            Estimated Annual ZEVs Supplied (from below):
          </h3>
          <div className="space-y-1 text-sm text-primaryText">
            <div className="flex justify-between">
              <span>Estimated Class A Credit Total:</span>
              <span className="text-right">{formatNumeric(estimatedClassATotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Class B Credit Total:</span>
              <span className="text-right">{formatNumeric(estimatedClassBTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
