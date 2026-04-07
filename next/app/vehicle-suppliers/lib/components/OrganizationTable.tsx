"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table, Button } from "@/app/lib/components";
import { OrganizationSparse } from "../data";
import { Routes } from "@/app/lib/constants";
import Link from "next/link";

export const OrganizationTable = (props: {
  organizations: OrganizationSparse[];
  totalNumberOfOrganizations: number;
  navigationAction: (id: number) => Promise<void>;
  canCreateNewOrg: boolean;
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
      headerContent={
        props.canCreateNewOrg ? (
          <Link href={`${Routes.VehicleSuppliers}/new`}>
            <Button
              variant="primary"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              }
              iconPosition="left"
            >
              New Supplier
            </Button>
          </Link>
        ) : undefined
      }
    />
  );
};
