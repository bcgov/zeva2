"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getSupplementaryReportStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { LegacySupplementary } from "../data";

export const LegacySupplementariesTable = (props: {
  supplementaries: LegacySupplementary[];
  totalNumbeOfSupplementaries: number;
  userIsGov: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.LegacySupplementary}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<LegacySupplementary>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getSupplementaryReportStatusEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<LegacySupplementary, any>[] = [
      columnHelper.accessor((row) => modelYearEnumMap[row.modelYear], {
        id: "modelYear",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => row.sequenceNumber, {
        id: "sequenceNumber",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Sequence Number</span>,
      }),
    ];
    if (props.userIsGov) {
      result.unshift(
        columnHelper.accessor((row) => row.organization?.name, {
          id: "organization",
          enableSorting: false,
          enableColumnFilter: false,
          header: () => <span>Supplier</span>,
        }),
      );
    }
    result.unshift(
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>ID</span>,
      }),
    );
    return result;
  }, [columnHelper, props.userIsGov]);

  return (
    <Table<LegacySupplementary>
      columns={columns}
      data={props.supplementaries}
      totalNumberOfRecords={props.totalNumbeOfSupplementaries}
      navigationAction={navigationAction}
    />
  );
};
