"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getReassessmentStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { LegacyReassessmentSerialized } from "../constants";

export const LegacyReassessmentsTable = (props: {
  reassessments: LegacyReassessmentSerialized[];
  userIsGov: boolean;
  headerContent?: ReactNode;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.LegacyReassessments}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<LegacyReassessmentSerialized>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getReassessmentStatusEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<LegacyReassessmentSerialized, any>[] = [
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
      columnHelper.accessor((row) => row.issuedDate ?? "--", {
        id: "issuedDate",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Issued Date</span>,
      }),
    );
    return result;
  }, [columnHelper, props.reassessments, props.userIsGov]);

  return (
    <ClientSideTable<LegacyReassessmentSerialized>
      columns={columns}
      data={props.reassessments}
      navigationAction={navigationAction}
      enableFiltering={true}
      enableSorting={true}
      headerContent={props.headerContent}
    />
  );
};
