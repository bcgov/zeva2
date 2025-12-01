"use client";

import React, { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getReassessmentStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { LegacyReassessment } from "../data";

export const LegacyReassessmentsTable = (props: {
  reassessments: LegacyReassessment[];
  totalNumbeOfReassessments: number;
  userIsGov: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.LegacyReassessments}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<LegacyReassessment>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getReassessmentStatusEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<LegacyReassessment, any>[] = [
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
  }, [columnHelper, props.reassessments, props.userIsGov]);

  return (
    <Table<LegacyReassessment>
      columns={columns}
      data={props.reassessments}
      totalNumberOfRecords={props.totalNumbeOfReassessments}
      navigationAction={navigationAction}
    />
  );
};
