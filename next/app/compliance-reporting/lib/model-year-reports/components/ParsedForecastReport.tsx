"use client";

import { JSX, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import { ParsedForecast } from "../utils";

type TableZevForecastRecord = ParsedForecast["zevRecords"][number] & {
  id: number;
};

export const ParsedForecastTables = (props: { forecast: ParsedForecast }) => {
  // Add id to each record for table compatibility
  const zevRecordsWithId: TableZevForecastRecord[] = useMemo(
    () =>
      props.forecast.zevRecords.map((record, index) => ({
        ...record,
        id: index,
      })),
    [props.forecast.zevRecords],
  );

  // Define columns for ZEV records table
  const zevColumnHelper = createColumnHelper<TableZevForecastRecord>();
  const zevColumns = useMemo<ColumnDef<TableZevForecastRecord, any>[]>(
    () => [
      zevColumnHelper.accessor((row) => row.modelYear, {
        id: "modelYear",
        header: "Model Year",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.make, {
        id: "make",
        header: "Make",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.model, {
        id: "model",
        header: "Model",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.type, {
        id: "type",
        header: "Type",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.range, {
        id: "range",
        header: "Range",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.zevClass, {
        id: "zevClass",
        header: "ZEV Class",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.interiorVolume, {
        id: "interiorVolume",
        header: "Interior Volume",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      zevColumnHelper.accessor((row) => row.supplyForecast, {
        id: "supplyForecast",
        header: "Supply Forecast",
        enableSorting: true,
        enableColumnFilter: true,
      }),
    ],
    [zevColumnHelper],
  );

  const headerClasses = useMemo(() => {
    return "p-2 border-b border-dividerMedium/30 font-semibold";
  }, []);

  const entries = useMemo(() => {
    const result: JSX.Element[] = [];
    for (const index of [1, 2, 3]) {
      const records = props.forecast.statistics[index];
      const borderClasses =
        index === 3 ? "" : "border-b border-dividerMedium/30";
      let backgroundClasses = "bg-gray-100";
      if (index === 2) {
        backgroundClasses = "";
      } else if (index === 3) {
        backgroundClasses = "bg-primaryBlue/10";
      }
      for (const i of [0, 1, 2, 3]) {
        result.push(
          <div
            key={`${index}-${i}-type`}
            className={`p-2 ${borderClasses} ${backgroundClasses}`}
          >
            {records[i]}
          </div>,
        );
      }
    }
    return result;
  }, [props.forecast]);

  return (
    <div className="flex flex-col gap-2 border border-dividerMedium/40 pb-2">
      <div className="p-2 font-semibold font-lg bg-gray-100">
        Forecast Report
      </div>
      <div className="flex flex-col gap-2 px-2">
        <ClientSideTable<TableZevForecastRecord>
          columns={zevColumns}
          data={zevRecordsWithId}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
          headerContent="ZEV Records"
        />
        <div className="flex flex-col border border-dividerMedium/40">
          <div className="p-2 font-lg font-semibold border-b border-dividerMedium/30 bg-gray-100">
            Non-ZEV Records
          </div>
          <div className="grid grid-cols-4">
            <div className={headerClasses}>
              {props.forecast.statistics[0][0]}
            </div>
            <div className={headerClasses}>
              {props.forecast.statistics[0][1]}
            </div>
            <div className={headerClasses}>
              {props.forecast.statistics[0][2]}
            </div>
            <div className={headerClasses}>
              {props.forecast.statistics[0][3]}
            </div>
            {entries}
          </div>
        </div>
      </div>
    </div>
  );
};
