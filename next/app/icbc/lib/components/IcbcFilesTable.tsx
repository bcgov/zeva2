"use client";

import { Table } from "@/app/lib/components";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { IcbcFileSparseSerialized } from "../utils";
import { lowerCaseAndCapitalize } from "@/app/lib/utils/enumMaps";

export const IcbcFilesTable = (props: {
  files: IcbcFileSparseSerialized[];
  totalNumberOfFiles: number;
}) => {
  const columnHelper = createColumnHelper<IcbcFileSparseSerialized>();
  const columns = useMemo(() => {
    const result: ColumnDef<IcbcFileSparseSerialized, any>[] = [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.timestamp, {
        id: "timestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Upload Date</span>,
      }),
      columnHelper.accessor((row) => lowerCaseAndCapitalize(row.status), {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => (row.isLegacy ? "Yes" : "No"), {
        id: "isLegacy",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Is Legacy</span>,
      }),
      columnHelper.accessor((row) => row.numberOfRecordsPreProcessing ?? "-", {
        id: "numberOfRecordsPreProcessing",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Number of ICBC Records Pre-Processing</span>,
      }),
      columnHelper.accessor((row) => row.numberOfRecordsPostProcessing ?? "-", {
        id: "numberOfRecordsPostProcessing",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Number of ICBC Records Post-Processing</span>,
      }),
    ];
    return result;
  }, [columnHelper, props.files]);
  return (
    <Table<IcbcFileSparseSerialized>
      columns={columns}
      data={props.files}
      totalNumberOfRecords={props.totalNumberOfFiles}
    />
  );
};
