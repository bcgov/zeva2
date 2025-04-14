"use client";

import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { ZevUnitTransferSparse } from "../data";

interface Props {
  transfers: ZevUnitTransferSparse[];
  totalNumbeOfTransfers: number;
  navigationAction: (id: string) => Promise<void>;
}

/**
 * Component that defines the columns / structure of ZevUnitTransferTable
 **/
export default function ZevUnitTransferTable({
  transfers,
  totalNumbeOfTransfers,
  navigationAction,
}: Props) {
  const columnHelper = createColumnHelper<ZevUnitTransferSparse>();

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => <i>{info.getValue()}</i>,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.transferFrom.name, {
        id: "transferFrom",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => <i>{info.getValue()}</i>,
        header: () => <span>From</span>,
      }),
      columnHelper.accessor((row) => row.transferTo.name, {
        id: "transferTo",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.renderValue(),
        header: () => <span>To</span>,
      }),
      columnHelper.accessor((row) => row.status, {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.renderValue(),
        header: () => <span>Status</span>,
      }),
    ],
    [columnHelper],
  );

  return (
    <Table
      columns={columns}
      data={transfers}
      totalNumberOfRecords={totalNumbeOfTransfers}
      navigationAction={navigationAction}
    />
  );
}
