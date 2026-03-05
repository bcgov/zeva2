"use client";

import { useCallback, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getCreditTransferStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { CreditTransferSerialized } from "../constants";

export const CreditTransfersTable = (props: {
  transfers: CreditTransferSerialized[];
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.CreditTransfers}/${id}`);
  }, []);

  const statusMap = useMemo(() => {
    return getCreditTransferStatusEnumsToStringsMap();
  }, []);

  const columnHelper = createColumnHelper<CreditTransferSerialized>();
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.id.toString(), {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.transferFrom, {
        id: "transferFrom",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>From</span>,
      }),
      columnHelper.accessor((row) => row.transferTo, {
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
      columnHelper.accessor((row) => row.submittedToTransferToDate ?? "--", {
        id: "submittedToTransferToDate",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Submitted to Transfer To Date</span>,
      }),
      columnHelper.accessor((row) => row.approvedByTransferToDate ?? "--", {
        id: "approvedByTransferToDate",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Approved by Transfer To Date</span>,
      }),
      columnHelper.accessor((row) => row.aCredits, {
        id: "aCredits",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>A Credits</span>,
      }),
      columnHelper.accessor((row) => row.bCredits, {
        id: "bCredits",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>B Credits</span>,
      }),
      columnHelper.accessor((row) => row.transferValue, {
        id: "transferValue",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Transfer Value</span>,
      }),
    ],
    [columnHelper],
  );

  return (
    <ClientSideTable<CreditTransferSerialized>
      columns={columns}
      data={props.transfers}
      navigationAction={navigationAction}
      enableFiltering={true}
      enableSorting={true}
    />
  );
};
