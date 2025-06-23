"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { useMemo } from "react";
import { PenaltyCreditSparse } from "../data";
import {
  getModelYearEnumsToStringsMap,
  getPenaltyCreditStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const PenaltyCreditsTable = (props: {
  credits: PenaltyCreditSparse[];
  totalNumberOfCredits: number;
  navigationAction: (id: number) => Promise<never>;
}) => {
  const columnHelper = createColumnHelper<PenaltyCreditSparse>();
  const columns = useMemo(() => {
    const modelYearsMap = getModelYearEnumsToStringsMap();
    const statusesMap = getPenaltyCreditStatusEnumsToStringsMap();
    const result: ColumnDef<PenaltyCreditSparse, any>[] = [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => modelYearsMap[row.complianceYear], {
        id: "complianceYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Compliance Year</span>,
      }),
      columnHelper.accessor((row) => statusesMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => row.organization.name, {
        id: "organization",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Organization</span>,
      }),
    ];
    return result;
  }, [columnHelper, props.credits]);
  return (
    <Table<PenaltyCreditSparse>
      columns={columns}
      data={props.credits}
      totalNumberOfRecords={props.totalNumberOfCredits}
      navigationAction={props.navigationAction}
    />
  );
};
