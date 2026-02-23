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
    <div className="col-span-1 lg:col-span-5 bg-lightGrey border border-dividerMedium p-6 rounded">
      <fieldset>
        <div className="mb-6">
          <label className="block text-sm font-medium text-primaryText mb-2" htmlFor="model-year">
            Model Year
          </label>
          <select
            className="w-full lg:w-1/2 px-3 py-2 border border-dividerMedium rounded bg-white text-primaryText focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
            id="model-year"
            name="model-year"
            value={selectedYearOption}
            onChange={(e) => onInputChange("model-year", e.target.value)}
          >
            {selectedYearOption === "" && (
              <option disabled value="">
                Select an option
              </option>
            )}
            {modelYearStrings.map((year, idx) => (
              <option key={year} value={modelYearList[idx]}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <div className="mb-4">
            <div className="text-sm font-medium text-primaryText">
              Supplier class
            </div>
            <div className="text-sm text-secondaryText">
              (based on average of previous 3 year total vehicles supplied)
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start p-3 border border-dividerMedium rounded bg-white">
              <input
                type="radio"
                id="supplier-size-small"
                name="supplier-size"
                value="small"
                checked={supplierSize === "small"}
                onChange={(e) => onInputChange("supplier-size", e.target.value)}
                className="mt-0.5 mr-2 h-4 w-4 text-primaryBlue focus:ring-primaryBlue border-dividerMedium"
              />
              <label htmlFor="supplier-size-small" className="text-sm text-primaryText">
                Small Volume Supplier (Less than 1,000 total vehicles supplied)
              </label>
            </div>
            <div className="flex items-start p-3 border border-dividerMedium rounded bg-white">
              <input
                type="radio"
                id="supplier-size-medium"
                name="supplier-size"
                value="medium"
                checked={supplierSize === "medium"}
                onChange={(e) => onInputChange("supplier-size", e.target.value)}
                className="mt-0.5 mr-2 h-4 w-4 text-primaryBlue focus:ring-primaryBlue border-dividerMedium"
              />
              <label htmlFor="supplier-size-medium" className="text-sm text-primaryText">
                Medium Volume Supplier (1,000 to 4,999 total vehicles supplied)
              </label>
            </div>
            <div className="flex items-start p-3 border border-dividerMedium rounded bg-white">
              <input
                type="radio"
                id="supplier-size-large"
                name="supplier-size"
                value="large"
                checked={supplierSize === "large"}
                onChange={(e) => onInputChange("supplier-size", e.target.value)}
                className="mt-0.5 mr-2 h-4 w-4 text-primaryBlue focus:ring-primaryBlue border-dividerMedium"
              />
              <label htmlFor="supplier-size-large" className="text-sm text-primaryText">
                Large Volume Supplier (5,000 or more total vehicles supplied)
              </label>
            </div>
          </div>

          {supplierSize && complianceYearInfo && (
            <div className="mt-4 space-y-2 text-sm text-primaryText">
              <div className="flex justify-between">
                <span>Compliance Ratio:</span>
                <span>{complianceYearInfo.complianceRatio}%</span>
              </div>
              {supplierSize === "large" && (
                <div className="flex justify-between">
                  <span>Large Supplier Class A Ratio:</span>
                  <span>{complianceYearInfo.zevClassA}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label
            className="block text-sm font-medium text-primaryText mb-2"
            htmlFor="total-sales-number"
          >
            Estimated vehicle supplied
          </label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Example: 5000"
            id="total-sales-number"
            className="w-full lg:w-1/2 px-3 py-2 border border-dividerMedium rounded bg-white text-right text-primaryText placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
            onChange={(e) => onInputChange("total-sales-number", e.target.value)}
          />
        </div>
      </fieldset>
    </div>
  );
};
