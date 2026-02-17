"use client";

import { useState, useMemo } from "react";
import { EstimatedModelSale, VehicleModel } from "../types";
import { ModelYear } from "@/prisma/generated/client";

type CalculatorModelTableProps = {
  models: VehicleModel[];
  selectedModelYear: ModelYear | "";
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
  selectedModelYear,
  estimatedModelSales,
  onModelSaleChange,
}: CalculatorModelTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter models based on selected model year and search term
  const filteredModels = useMemo(() => {
    let filtered = models;

    // Filter by selected model year
    if (selectedModelYear) {
      filtered = filtered.filter((model) => model.modelYear === selectedModelYear);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((model) => {
        const modelYearStr = model.modelYear.replace("MY_", "");
        const fullName = `${modelYearStr} ${model.make} ${model.modelName}`.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    return filtered;
  }, [models, selectedModelYear, searchTerm]);

  const findEstimatedSale = (modelId: number) =>
    estimatedModelSales.find((sale) => sale.id === modelId);

  return (
    <div className="mt-6 bg-white border border-dividerMedium rounded shadow-level-1">
      <div className="p-4 border-b border-dividerMedium">
        <h3 className="text-base font-semibold text-primaryText mb-3">
          Estimated annual ZEVs supplied
        </h3>
        <input
          type="text"
          placeholder="Search by model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full lg:w-1/3 px-3 py-2 border border-dividerMedium rounded bg-white text-primaryText placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-lightGrey border-b border-dividerMedium">
              <th className="px-4 py-3 text-left text-sm font-semibold text-primaryText">
                ZEV Model
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-primaryText">
                ZEV Class
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-primaryText">
                Credit Entitlement
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-primaryText">
                Estimated annual ZEVs supplied
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-primaryText">
                Estimated Credits Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-secondaryText">
                  {selectedModelYear
                    ? "No models found for the selected criteria."
                    : "Please select a model year to view available models."}
                </td>
              </tr>
            ) : (
              filteredModels.map((model) => {
                const estimatedSale = findEstimatedSale(model.id);
                const modelYearStr = model.modelYear.replace("MY_", "");
                return (
                  <tr key={model.id} className="border-b border-dividerMedium hover:bg-lightGrey">
                    <td className="px-4 py-3 text-left text-sm text-primaryText">
                      {modelYearStr} {model.make} {model.modelName}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-primaryText">
                      {model.creditClass}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-primaryText">
                      {model.creditValue}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        className="w-32 px-3 py-2 border border-dividerMedium rounded text-right text-primaryText bg-white focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
                        id={`input-sales-${model.id}`}
                        name="input-sales"
                        step="1"
                        type="number"
                        min="0"
                        placeholder="Text"
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
                    <td className="px-4 py-3 text-right text-sm text-primaryText">
                      {estimatedSale
                        ? `${formatNumeric(estimatedSale.value)}-${estimatedSale.creditClass}`
                        : "Result"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
