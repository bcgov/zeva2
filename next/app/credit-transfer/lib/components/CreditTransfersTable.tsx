"use client";

import React, { useCallback, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getCreditTransferStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { CreditTransferSparseSerialized } from "../utils";

interface Props {
  transfers: CreditTransferSparseSerialized[];
  totalNumbeOfTransfers: number;
}

/**
 * Component that defines the columns / structure of ZevUnitTransferTable
 **/
export const CreditTransfersTable = ({
  transfers,
  totalNumbeOfTransfers,
}: Props) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.CreditTransfers}/${id}`);
  }, []);

  const statusMap = useMemo(() => {
    return getCreditTransferStatusEnumsToStringsMap();
  }, []);

  const columnHelper = createColumnHelper<CreditTransferSparseSerialized>();
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.transferFrom.name, {
        id: "transferFrom",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>From</span>,
      }),
      columnHelper.accessor((row) => row.transferTo.name, {
        id: "transferTo",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>To</span>,
      }),
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
    ],
    [columnHelper],
  );

  return (
    <Table<CreditTransferSparseSerialized>
      columns={columns}
      data={transfers}
      totalNumberOfRecords={totalNumbeOfTransfers}
      navigationAction={navigationAction}
    />
  );
};
