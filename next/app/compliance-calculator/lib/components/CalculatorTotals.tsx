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

  return (
    <div className="col-span-1 lg:col-span-4 bg-white border border-gray-200 p-4 rounded">
      <table className="w-full">
        <tbody>
          <tr>
            <td className="font-bold text-primaryBlue pt-4 pb-2">
              Estimated Compliance Ratio Reduction:
            </td>
            <td className="pl-3 font-bold pt-4 pb-2 text-right">
              {complianceNumbers.total}
            </td>
          </tr>
          {supplierSize === "large" && (
            <>
              <tr>
                <td className="text-primaryBlue">-ZEV Class A Debit:</td>
                <td className="pl-3 text-right">{complianceNumbers.classA}</td>
              </tr>
              <tr>
                <td className="text-primaryBlue">-Unspecified ZEV Class Debit:</td>
                <td className="pl-3 text-right">{complianceNumbers.remaining}</td>
              </tr>
            </>
          )}
          <tr>
            <td className="font-bold text-primaryBlue pt-4 pb-2" colSpan={2}>
              Current Credit Balance:
            </td>
          </tr>
          <tr>
            <td className="text-primaryBlue">Class A Credit Total:</td>
            <td className="pl-3 text-right">{formatNumeric(creditBalance.A)}</td>
          </tr>
          <tr>
            <td className="text-primaryBlue">Class B Credit Total:</td>
            <td className="pl-3 text-right">{formatNumeric(creditBalance.B)}</td>
          </tr>
          <tr>
            <td className="text-primaryBlue pt-4 pb-2" colSpan={2}>
              <strong>Estimated Annual ZEVs Supplied</strong> (from below):
            </td>
          </tr>
          <tr>
            <td className="text-primaryBlue">Estimated Class A Credit Total:</td>
            <td className="pl-3 text-right">{formatNumeric(estimatedClassATotal)}</td>
          </tr>
          <tr>
            <td className="text-primaryBlue">Estimated Class B Credit Total:</td>
            <td className="pl-3 text-right">{formatNumeric(estimatedClassBTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
