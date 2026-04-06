"use client";

import { CreditApplicationSparseSerialized } from "../constants";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { ReactNode, useMemo } from "react";
import {
  getCreditApplicationStatusEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const ApplicationsTable = (props: {
  applications: CreditApplicationSparseSerialized[];
  totalNumberOfApplications: number;
  navigationAction: (id: number) => Promise<never>;
  userIsGov: boolean;
  headerContent?: ReactNode;
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
      columnHelper.accessor((row) => row.submissionTimestamp ?? "--", {
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
      columnHelper.accessor((row) => row.transactionTimestamp ?? "--", {
        id: "transactionTimestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Transaction Date</span>,
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
      columnHelper.accessor((row) => row.eligibleVinsCount ?? "--", {
        id: "eligibleVinsCount",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Eligible VINs</span>,
      }),
      columnHelper.accessor((row) => row.ineligibleVinsCount ?? "--", {
        id: "ineligibleVinsCount",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Ineligible VINs</span>,
      }),
      columnHelper.accessor((row) => row.aCredits ?? "--", {
        id: "aCredits",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>A-credits</span>,
      }),
      columnHelper.accessor((row) => row.bCredits ?? "--", {
        id: "bCredits",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>B-credits</span>,
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
      headerContent={props.headerContent}
    />
  );
};
