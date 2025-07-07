"use client";

import React, { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import type { UserWithOrgName } from "../data";

export interface UserTableProps {
  users: UserWithOrgName[];
  totalCount: number;
  navigationAction?: (id: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  totalCount,
  navigationAction,
  footer = false,
}) => {
  const columnHelper = createColumnHelper<UserWithOrgName>();

  const columns = useMemo<ColumnDef<UserWithOrgName, any>[]>(() => {
    const base: ColumnDef<UserWithOrgName, any>[] = [
      columnHelper.accessor("firstName", {
        header: () => <span>First Name</span>,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor("lastName", {
        header: () => <span>Last Name</span>,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor("contactEmail", {
        header: () => <span>Contact Email</span>,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor("idpUsername", {
        header: () => <span>IDP Username</span>,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor("idpEmail", {
        header: () => <span>IDP Email</span>,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor("isActive", {
        header: () => <span>Status</span>,
        cell: (info) => (info.getValue() ? "Active" : "Inactive"),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.roles.join(", "), {
        id: "roles",
        header: () => <span>Roles</span>,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      }),
    ];

    if (users.some((u) => u.organization)) {
      base.unshift(
        columnHelper.accessor((row) => row.organization?.name, {
          id: "organization",
          header: () => <span>Organization</span>,
          cell: (info) => info.getValue(),
          enableSorting: true,
          enableColumnFilter: true,
        })
      );
    }

    return base;
  }, [users]);

  return (
    <Table<UserWithOrgName>
      columns={columns}
      data={users}
      totalNumberOfRecords={totalCount}
      navigationAction={navigationAction}
    />
  );
};
