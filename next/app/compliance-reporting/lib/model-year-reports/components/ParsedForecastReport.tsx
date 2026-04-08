"use client";

import { useMemo } from "react";
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

  return (
    <div className="flex-col space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">ZEV Records</h3>
        <ClientSideTable<TableZevForecastRecord>
          columns={zevColumns}
          data={zevRecordsWithId}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Non-ZEV Records</h3>
        <table key="details" className="w-full text-left">
          <thead>
            <tr>
              {props.forecast.statistics[0].map((myHeader) => {
                return <th key={myHeader ? myHeader : "_"}>{myHeader}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => {
              return (
                <tr key={i}>
                  {props.forecast.statistics[i].map((element) => {
                    return <td key={crypto.randomUUID()}>{element}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
