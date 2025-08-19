"use client";

import { CreditApplicationSparseSerialized } from "../utils";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { useMemo } from "react";

export const ApplicationsTable = (props: {
  applications: CreditApplicationSparseSerialized[];
  totalNumberOfApplications: number;
  navigationAction: (id: number) => Promise<never>;
}) => {
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
        header: () => <span>Date</span>,
      }),
      columnHelper.accessor((row) => row.status, {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
    ];
    if (
      props.applications.some((application) => {
        return application.organization;
      })
    ) {
      const supplierColumn = columnHelper.accessor((row) => row.organization, {
        id: "organization",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Supplier</span>,
      });
      result.splice(1, 0, supplierColumn);
    }
    return result;
  }, [columnHelper, props.applications]);
  return (
    <Table<CreditApplicationSparseSerialized>
      columns={columns}
      data={props.applications}
      totalNumberOfRecords={props.totalNumberOfApplications}
      navigationAction={props.navigationAction}
    />
  );
};
