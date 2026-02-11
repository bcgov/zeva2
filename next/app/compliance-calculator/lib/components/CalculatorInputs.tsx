"use client";

import { ModelYear } from "@/prisma/generated/client";
import { ComplianceRatio, SupplierSize } from "../types";

type CalculatorInputsProps = {
  modelYearList: ModelYear[];
  selectedYearOption: ModelYear | "";
  supplierSize: SupplierSize;
  complianceYearInfo: ComplianceRatio | null;
  onInputChange: (id: string, value: string) => void;
};

export const CalculatorInputs = ({
  modelYearList,
  selectedYearOption,
  supplierSize,
  complianceYearInfo,
  onInputChange,
}: CalculatorInputsProps) => {
  const modelYearStrings = modelYearList.map((my) => my.replace("MY_", ""));

  return (
    <div className="col-span-1 lg:col-span-5 bg-gray-100 p-4 rounded">
      <fieldset>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="model-year">
            Model Year:
          </label>
          <select
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primaryBlue"
            id="model-year"
            name="model-year"
            value={selectedYearOption}
            onChange={(e) => onInputChange("model-year", e.target.value)}
          >
            {selectedYearOption === "" && (
              <option disabled value="">
                --
              </option>
            )}
            {modelYearStrings.map((year, idx) => (
              <option key={year} value={modelYearList[idx]}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <div className="text-primaryBlue mb-2">
            <label htmlFor="supplier-size" className="font-medium">
              Supplier Class
            </label>
            <span className="text-sm">
              {" "}
              (based on average of previous 3 year total vehicles supplied):
            </span>
          </div>
          <div className="ml-4 space-y-2">
            <div>
              <span className="text-primaryBlue text-sm">
                Small Volume Supplier (less than 1,000 total vehicles supplied)
              </span>
            </div>
            <div>
              <input
                type="radio"
                id="supplier-size-medium"
                name="supplier-size"
                value="medium"
                checked={supplierSize === "medium"}
                onChange={(e) => onInputChange("supplier-size", e.target.value)}
                className="mr-2"
              />
              <label htmlFor="supplier-size-medium" className="text-primaryBlue text-sm">
                Medium Volume Supplier (1,000 to 4,999 total vehicles supplied)
              </label>
            </div>
            <div>
              <input
                type="radio"
                id="supplier-size-large"
                name="supplier-size"
                value="large"
                checked={supplierSize === "large"}
                onChange={(e) => onInputChange("supplier-size", e.target.value)}
                className="mr-2"
              />
              <label htmlFor="supplier-size-large" className="text-primaryBlue text-sm">
                Large Volume Supplier (5,000 or more total vehicles supplied)
              </label>
            </div>
          </div>

          {supplierSize && complianceYearInfo && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-primaryBlue">
                <span>Compliance Ratio:</span>
                <span>{complianceYearInfo.complianceRatio}%</span>
              </div>
              {supplierSize === "large" && (
                <div className="flex justify-between text-primaryBlue">
                  <span>Large Supplier Class A Ratio:</span>
                  <span>{complianceYearInfo.zevClassA}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-0">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="total-sales-number"
          >
            Estimated Vehicles Supplied:
          </label>
          <input
            type="number"
            min="0"
            step="1"
            id="total-sales-number"
            className="w-full lg:w-1/2 px-3 py-2 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-primaryBlue"
            onChange={(e) => onInputChange("total-sales-number", e.target.value)}
          />
        </div>
      </fieldset>
    </div>
  );
};
