"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { LegacySupplementarySerialized } from "../constants";

export const LegacySupplementariesTable = (props: {
  supplementaries: LegacySupplementarySerialized[];
  userIsGov: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.LegacySupplementary}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<LegacySupplementarySerialized>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getMyrStatusEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<LegacySupplementarySerialized, any>[] = [
      columnHelper.accessor((row) => modelYearEnumMap[row.modelYear], {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
    ];
    if (props.userIsGov) {
      result.unshift(
        columnHelper.accessor((row) => row.supplier, {
          id: "organization",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Supplier</span>,
        }),
      );
      result.push(
        columnHelper.accessor((row) => row.submittedDate ?? "--", {
          id: "submittedDate",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Submitted Date</span>,
        }),
      );
    }
    result.unshift(
      columnHelper.accessor((row) => row.id.toString(), {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
    );
    result.push(
      columnHelper.accessor((row) => row.assessedDate ?? "--", {
        id: "issuedDate",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Assessed Date</span>,
      }),
    );
    return result;
  }, [columnHelper, props.userIsGov]);

  return (
    <ClientSideTable<LegacySupplementarySerialized>
      columns={columns}
      data={props.supplementaries}
      navigationAction={navigationAction}
      enableFiltering={true}
      enableSorting={true}
    />
  );
};
