"use client";

import { CreditApplicationSparseSerialized } from "../utils";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { useMemo } from "react";
import {
  getCreditApplicationStatusEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const ApplicationsTable = (props: {
  applications: CreditApplicationSparseSerialized[];
  totalNumberOfApplications: number;
  navigationAction: (id: number) => Promise<never>;
  userIsGov: boolean;
}) => {
  const statusMap = useMemo(() => {
    return getCreditApplicationStatusEnumsToStringsMap();
  }, []);
  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const columnHelper = createColumnHelper<CreditApplicationSparseSerialized>();
  const columns = useMemo(() => {
    const result: ColumnDef<CreditApplicationSparseSerialized, any>[] = [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.submissionTimestamp, {
        id: "submissionTimestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Submission Date</span>,
      }),
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => row.transactionTimestamps, {
        id: "transactionTimestamps",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cellProps) => {
          const dates = cellProps.row.original.transactionTimestamps;
          return dates.join(", ");
        },
        header: () => <span>Transaction Date(s)</span>,
      }),
      columnHelper.accessor((row) => row.modelYears, {
        id: "modelYears",
        enableSorting: false,
        enableColumnFilter: true,
        cell: (cellProps) => {
          const mys = cellProps.row.original.modelYears.map((my) => {
            return modelYearsMap[my];
          });
          return mys.join(", ");
        },
        header: () => <span>Model Year(s)</span>,
      }),
    ];
    if (props.userIsGov) {
      const supplierColumn = columnHelper.accessor((row) => row.organization, {
        id: "organization",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Supplier</span>,
      });
      result.splice(1, 0, supplierColumn);
    }
    return result;
  }, [columnHelper, props.applications, props.userIsGov]);
  return (
    <Table<CreditApplicationSparseSerialized>
      columns={columns}
      data={props.applications}
      totalNumberOfRecords={props.totalNumberOfApplications}
      navigationAction={props.navigationAction}
    />
  );
};
