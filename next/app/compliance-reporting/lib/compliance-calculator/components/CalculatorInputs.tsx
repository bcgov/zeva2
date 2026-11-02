"use client";

import { ModelYear } from "@/prisma/generated/client";
import { Dropdown } from "@/app/lib/components/inputs";
import { ComplianceRatio, SupplierSize } from "../types";

type CalculatorInputsProps = {
  modelYearList: ModelYear[];
  selectedYearOption: ModelYear | "";
  supplierSize: SupplierSize;
  complianceYearInfo: ComplianceRatio | null;
  onInputChange: (id: string, value: string) => void;
};

const SUPPLIER_OPTIONS: {
  value: Exclude<SupplierSize, "">;
  title: string;
  description: string;
}[] = [
  {
    value: "small",
    title: "Small Volume Supplier",
    description: "Less than 1,000 total vehicles supplied",
  },
  {
    value: "medium",
    title: "Medium Volume Supplier",
    description: "1,000 to 4,999 total vehicles supplied",
  },
  {
    value: "large",
    title: "Large Volume Supplier",
    description: "5,000 or more total vehicles supplied",
  },
];

export const CalculatorInputs = ({
  modelYearList,
  selectedYearOption,
  supplierSize,
  complianceYearInfo,
  onInputChange,
}: CalculatorInputsProps) => {
  const modelYearStrings = modelYearList.map((my) => my.replace("MY_", ""));

  return (
    <div className="col-span-1 lg:col-span-4 bg-lightGrey border border-calculatorStroke p-4 rounded">
      <fieldset>
        <div className="pb-4">
          <Dropdown
            id="model-year"
            label="Model Year"
            placeholder="Select an option"
            options={modelYearList.map((my, idx) => ({
              value: my,
              label: modelYearStrings[idx],
            }))}
            value={selectedYearOption}
            onChange={(value) => onInputChange("model-year", value)}
            className="w-full"
          />
        </div>

        <div className="py-4 border-t border-calculatorStroke">
          <div className="mb-3">
            <div className="text-sm font-bold text-primaryText">
              Supplier class
            </div>
            <div className="text-xs text-secondaryText">
              Based on average of previous 3 year total vehicles supplied:
            </div>
          </div>
          <div className="space-y-3">
            {SUPPLIER_OPTIONS.map(({ value, title, description }) => (
              <label
                key={value}
                htmlFor={`supplier-size-${value}`}
                className="flex items-start gap-2 p-3 border border-calculatorStroke rounded bg-white cursor-pointer"
              >
                <input
                  type="radio"
                  id={`supplier-size-${value}`}
                  name="supplier-size"
                  value={value}
                  checked={supplierSize === value}
                  onChange={(e) =>
                    onInputChange("supplier-size", e.target.value)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 text-primaryBlue focus:ring-primaryBlue border-calculatorStroke"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-primaryText">
                    {title}
                  </span>
                  <span className="text-xs text-secondaryText">
                    {description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="py-4 border-t border-calculatorStroke">
          <label
            className="block text-sm text-primaryText mb-1.5"
            htmlFor="total-sales-number"
          >
            Estimated vehicle supplied
          </label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Example text"
            id="total-sales-number"
            className="w-full px-3 py-2 text-sm border border-calculatorStroke rounded-md bg-white text-primaryText placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
            onChange={(e) =>
              onInputChange("total-sales-number", e.target.value)
            }
          />
        </div>

        <div className="pt-4 border-t border-calculatorStroke space-y-2 text-primaryText">
          <div className="flex justify-between font-bold">
            <span>Compliance ratio:</span>
            <span>
              {supplierSize && complianceYearInfo
                ? `${complianceYearInfo.complianceRatio}%`
                : "..."}
            </span>
          </div>
          {supplierSize === "large" && complianceYearInfo && (
            <div className="flex justify-between text-sm">
              <span>Large Supplier Class A Ratio:</span>
              <span>{complianceYearInfo.zevClassA}%</span>
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
};
