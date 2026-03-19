"use client";

import { ClientSideTable } from "@/app/lib/components";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ReactNode, useMemo } from "react";
import { IcbcFileSerialized } from "../utils";
import { lowerCaseAndCapitalize } from "@/app/lib/utils/enumMaps";

export const IcbcFilesTable = (props: {
  files: IcbcFileSerialized[];
  headerContent?: ReactNode;
}) => {
  const columnHelper = createColumnHelper<IcbcFileSerialized>();
  const columns = useMemo(() => {
    const result: ColumnDef<IcbcFileSerialized, any>[] = [
      columnHelper.accessor((row) => row.id.toString(), {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.timestamp, {
        id: "timestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Date</span>,
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
      columnHelper.accessor((row) => row.createTimestamp, {
        id: "createTimestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Uploaded On</span>,
      }),
      columnHelper.accessor((row) => (row.uploadedBy ? row.uploadedBy : "-"), {
        id: "uploadedBy",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Uploaded By</span>,
      }),
      columnHelper.accessor(
        (row) =>
          row.numberOfRecordsPreProcessing
            ? row.numberOfRecordsPreProcessing.toString()
            : "-",
        {
          id: "numberOfRecordsPreProcessing",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Number of ICBC Records Pre-Processing</span>,
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.numberOfRecordsPostProcessing
            ? row.numberOfRecordsPostProcessing.toString()
            : "-",
        {
          id: "numberOfRecordsPostProcessing",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Number of ICBC Records Post-Processing</span>,
        },
      ),
    ];
    return result;
  }, [columnHelper, props.files]);
  return (
    <ClientSideTable<IcbcFileSerialized>
      columns={columns}
      data={props.files}
      enableFiltering={true}
      enableSorting={true}
      initialPageSize={10}
      headerContent={props.headerContent}
    />
  );
};
