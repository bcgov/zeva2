"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { OrganizationSparse } from "../data";

export const OrganizationTable = (props: {
  organizations: OrganizationSparse[];
  totalNumberOfOrganizations: number;
  navigationAction: (id: number) => Promise<void>;
}) => {
  const columnHelper = createColumnHelper<OrganizationSparse>();

  const columns = useMemo(() => {
    const result: ColumnDef<OrganizationSparse, any>[] = [
      columnHelper.accessor((row) => row.name, {
        id: "name",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "Company Name",
      }),
      columnHelper.accessor((row) => row.supplierClass, {
        id: "supplierClass",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "Class",
      }),
      columnHelper.accessor((row) => row.zevUnitBalanceA, {
        id: "zevUnitBalanceA",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "ZEV Unit A Balance",
      }),
      columnHelper.accessor((row) => row.zevUnitBalanceB, {
        id: "zevUnitBalanceB",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "ZEV Unit B Balance",
      }),
    ];

    return result;
  }, [columnHelper]);

  return (
    <Table<OrganizationSparse>
      columns={columns}
      data={props.organizations}
      totalNumberOfRecords={props.totalNumberOfOrganizations}
      navigationAction={props.navigationAction}
    />
  );
};
