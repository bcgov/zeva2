"use client";

import { EstimatedModelSale, VehicleModel } from "../types";

type CalculatorModelTableProps = {
  models: VehicleModel[];
  estimatedModelSales: EstimatedModelSale[];
  onModelSaleChange: (modelId: number, value: number, creditValue: number, creditClass: string) => void;
};

const formatNumeric = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const CalculatorModelTable = ({
  models,
  estimatedModelSales,
  onModelSaleChange,
}: CalculatorModelTableProps) => {
  const findEstimatedSale = (modelId: number) =>
    estimatedModelSales.find((sale) => sale.id === modelId);

  return (
    <div className="my-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-gray-300 px-4 py-2 text-left">ZEV Model</th>
              <th className="border border-gray-300 px-4 py-2">ZEV Class</th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Credit Entitlement
              </th>
              <th className="border border-gray-300 px-4 py-2">
                Estimated annual ZEVs supplied
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right">
                Estimated Credits Total
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const estimatedSale = findEstimatedSale(model.id);
              const modelYearStr = model.modelYear.replace("MY_", "");
              return (
                <tr key={model.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-left">
                    {modelYearStr} {model.make} {model.modelName}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {model.creditClass}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {model.creditValue}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <input
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-primaryBlue"
                      id={`input-sales-${model.id}`}
                      name="input-sales"
                      step="1"
                      type="number"
                      min="0"
                      defaultValue=""
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        onModelSaleChange(
                          model.id,
                          value,
                          model.creditValue,
                          model.creditClass
                        );
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {estimatedSale
                      ? `${formatNumeric(estimatedSale.value)}-${estimatedSale.creditClass}`
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
