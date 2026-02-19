"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { EstimatedModelSale, VehicleModel } from "../types";
import { ModelYear } from "@/prisma/generated/client";
import { ClientSideTable } from "@/app/lib/components";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

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

type TableVehicleModel = VehicleModel & {
  estimatedSale?: EstimatedModelSale;
  displayName: string;
};

const columnHelper = createColumnHelper<TableVehicleModel>();

export const CalculatorModelTable = ({
  models,
  selectedModelYear,
  estimatedModelSales,
  onModelSaleChange,
}: CalculatorModelTableProps) => {
  const inputValuesRef = useRef<Record<number, string>>({});
  const [, setUpdateCounter] = useState(0);

  useEffect(() => {
    inputValuesRef.current = {};
    setUpdateCounter(0);
  }, [selectedModelYear]);

  const handleInputChange = useCallback((modelId: number, value: string, creditValue: number, creditClass: string) => {
    inputValuesRef.current[modelId] = value;
    const numValue = parseInt(value) || 0;
    onModelSaleChange(modelId, numValue, creditValue, creditClass);
    setUpdateCounter(c => c + 1);
  }, [onModelSaleChange]);

  const filteredModels = useMemo(() => {
    let filtered = models;

    if (selectedModelYear) {
      filtered = filtered.filter((model) => model.modelYear === selectedModelYear);
    }

    return filtered;
  }, [models, selectedModelYear]);

  const tableData = useMemo<TableVehicleModel[]>(() => {
    return filteredModels.map((model) => {
      const modelYearStr = model.modelYear.replace("MY_", "");
      return {
        ...model,
        displayName: `${modelYearStr} ${model.make} ${model.modelName}`,
      };
    });
  }, [filteredModels]);

  // Define columns
  const columns = useMemo<ColumnDef<TableVehicleModel, any>[]>(
    () => [
      columnHelper.accessor("displayName", {
        id: "displayName",
        header: "ZEV Model",
        enableColumnFilter: true,
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm text-primaryText">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("creditClass", {
        id: "creditClass",
        header: "ZEV Class",
        enableColumnFilter: true,
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm text-primaryText">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("creditValue", {
        id: "creditValue",
        header: "Credit Entitlement",
        enableColumnFilter: true,
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm text-primaryText">{info.getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: "estimatedSales",
        header: "Estimated annual ZEVs supplied",
        cell: (info) => {
          const modelId = info.row.original.id;
          return (
            <input
              className="w-32 px-3 py-2 border border-dividerMedium rounded text-left text-primaryText bg-white focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
              id={`input-sales-${modelId}`}
              name="input-sales"
              step="1"
              type="number"
              min="0"
              placeholder="Text"
              defaultValue={inputValuesRef.current[modelId] || ""}
              onChange={(e) => {
                handleInputChange(
                  modelId,
                  e.target.value,
                  info.row.original.creditValue,
                  info.row.original.creditClass
                );
              }}
            />
          );
        },
      }),
      columnHelper.display({
        id: "estimatedCreditsTotal",
        header: "Estimated Credits Total",
        cell: (info) => {
          const modelId = info.row.original.id;
          const inputValue = inputValuesRef.current[modelId];
          const creditValue = info.row.original.creditValue;
          const creditClass = info.row.original.creditClass;
          
          if (inputValue && parseInt(inputValue) > 0) {
            const totalCredits = parseInt(inputValue) * creditValue;
            return (
              <span className="text-sm text-primaryText">
                {formatNumeric(totalCredits)}-{creditClass}
              </span>
            );
          }
          
          return (
            <span className="text-sm text-primaryText">Result</span>
          );
        },
      }),
    ],
    [handleInputChange]
  );

  return (
    <div className="mt-6">
      {!selectedModelYear ? (
        <div className="bg-white border border-dividerMedium rounded shadow-level-1 p-8">
          <div className="text-center text-secondaryText">
            Please select a model year to view available models.
          </div>
        </div>
      ) : (
        <ClientSideTable<TableVehicleModel>
          columns={columns}
          data={tableData}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
          hideResetButton={true}
          headerContent={
            <div className="p-4 border-b border-dividerMedium">
              <h3 className="text-base font-semibold text-primaryText mb-3">
                Estimated annual ZEVs supplied
              </h3>
            </div>
          }
          customStyles={{
            container: "bg-white border border-dividerMedium rounded shadow-level-1",
            tableWrapper: "overflow-x-auto",
            table: "w-full border-collapse",
            thead: "bg-lightGrey border-b border-dividerMedium",
            theadTr: "bg-lightGrey border-b border-dividerMedium",
            theadTh: "px-4 py-3 text-sm font-semibold text-primaryText align-top",
            tbody: "bg-white",
            tbodyTr: "border-b border-dividerMedium hover:bg-lightGrey",
            tbodyTd: "px-4 py-3",
            pagination: "flex items-center justify-center bg-lightGrey w-full rounded p-2 border-t border-dividerMedium",
          }}
        />
      )}
    </div>
  );
};
