"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import { ParsedForecast } from "../utils";

type ZevForecastRecord = {
  id: number;
  modelYear: string;
  make: string;
  model: string;
  type: string;
  range: string;
  zevClass: string;
  interiorVolume: string;
  supplyForecast: string;
};

type NonZevForecastRecord = {
  id: number;
  modelYear: string;
  supplyForecast: string;
};

export const ParsedForecastTables = (props: { forecast: ParsedForecast }) => {
  // Add id to each record for table compatibility
  const zevRecordsWithId: ZevForecastRecord[] = useMemo(
    () =>
      props.forecast.zevRecords.map((record, index) => ({
        ...record,
        id: index,
      })),
    [props.forecast.zevRecords],
  );

  const nonZevRecordsWithId: NonZevForecastRecord[] = useMemo(
    () =>
      props.forecast.nonZevRecords.map((record, index) => ({
        ...record,
        id: index,
      })),
    [props.forecast.nonZevRecords],
  );

  // Define columns for ZEV records table
  const zevColumnHelper = createColumnHelper<ZevForecastRecord>();
  const zevColumns = useMemo<ColumnDef<ZevForecastRecord, any>[]>(
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

  // Define columns for Non-ZEV records table
  const nonZevColumnHelper = createColumnHelper<NonZevForecastRecord>();
  const nonZevColumns = useMemo<ColumnDef<NonZevForecastRecord, any>[]>(
    () => [
      nonZevColumnHelper.accessor((row) => row.modelYear, {
        id: "modelYear",
        header: "Model Year",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      nonZevColumnHelper.accessor((row) => row.supplyForecast, {
        id: "supplyForecast",
        header: "Supply Forecast",
        enableSorting: true,
        enableColumnFilter: true,
      }),
    ],
    [nonZevColumnHelper],
  );

  return (
    <div className="flex-col space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">ZEV Records</h3>
        <ClientSideTable<ZevForecastRecord>
          columns={zevColumns}
          data={zevRecordsWithId}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Non-ZEV Records</h3>
        <ClientSideTable<NonZevForecastRecord>
          columns={nonZevColumns}
          data={nonZevRecordsWithId}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
        />
      </div>
    </div>
  );
};

