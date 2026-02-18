"use client";

import { useMemo } from "react";
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

export const CalculatorModelTable = ({
  models,
  selectedModelYear,
  estimatedModelSales,
  onModelSaleChange,
}: CalculatorModelTableProps) => {
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
      const estimatedSale = estimatedModelSales.find((sale) => sale.id === model.id);
      return {
        ...model,
        displayName: `${modelYearStr} ${model.make} ${model.modelName}`,
        estimatedSale,
      };
    });
  }, [filteredModels, estimatedModelSales]);

  // Define columns
  const columnHelper = createColumnHelper<TableVehicleModel>();
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
        cell: (info) => (
          <input
            className="w-32 px-3 py-2 border border-dividerMedium rounded text-left text-primaryText bg-white focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-primaryBlue"
            id={`input-sales-${info.row.original.id}`}
            name="input-sales"
            step="1"
            type="number"
            min="0"
            placeholder="Text"
            defaultValue=""
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              onModelSaleChange(
                info.row.original.id,
                value,
                info.row.original.creditValue,
                info.row.original.creditClass
              );
            }}
          />
        ),
      }),
      columnHelper.display({
        id: "estimatedCreditsTotal",
        header: "Estimated Credits Total",
        cell: (info) => {
          const estimatedSale = info.row.original.estimatedSale;
          return (
            <span className="text-sm text-primaryText">
              {estimatedSale
                ? `${formatNumeric(estimatedSale.value)}-${estimatedSale.creditClass}`
                : "Result"}
            </span>
          );
        },
      }),
    ],
    [columnHelper, onModelSaleChange]
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
