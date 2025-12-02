"use client";

import React, { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
  getReassessmentStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { MyrSparseSerialized } from "../utilsServer";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export const ReportsTable = (props: {
  myrs: MyrSparseSerialized[];
  totalNumbeOfMyrs: number;
  userIsGov: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.ComplianceReporting}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<MyrSparseSerialized>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getMyrStatusEnumsToStringsMap();
  }, []);
  const reassessmentStatusMap = useMemo(() => {
    return getReassessmentStatusEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<MyrSparseSerialized, any>[] = [
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
      columnHelper.accessor(
        (row) =>
          row.reassessmentStatus
            ? reassessmentStatusMap[row.reassessmentStatus]
            : "--",
        {
          id: "reassessmentStatus",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Status</span>,
        },
      ),
    ];
    if (props.userIsGov) {
      result.unshift(
        columnHelper.accessor((row) => row.organization?.name, {
          id: "organization",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Supplier</span>,
        }),
      );
    }
    result.unshift(
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
    );
    return result;
  }, [columnHelper, props.myrs, props.userIsGov]);

  return (
    <Table<MyrSparseSerialized>
      columns={columns}
      data={props.myrs}
      totalNumberOfRecords={props.totalNumbeOfMyrs}
      navigationAction={navigationAction}
    />
  );
};
