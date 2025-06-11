"use client";

import React, { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { UserWithOrgName } from "../data";

export const UserTable = (props: {
  users: UserWithOrgName[];
  navigationAction: (id: number) => Promise<void>;
}) => {
  const columnHelper = createColumnHelper<UserWithOrgName>();

  const columns = useMemo(() => {
    const base: ColumnDef<UserWithOrgName, any>[] = [
      columnHelper.accessor("firstName", {
        header: () => <span>First Name</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("lastName", {
        header: () => <span>Last Name</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("contactEmail", {
        header: () => <span>Contact Email</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("idpUsername", {
        header: () => <span>IDP Username</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("idpEmail", {
        header: () => <span>IDP Email</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("isActive", {
        header: () => <span>Status</span>,
        cell: (info) => (info.getValue() ? "Active" : "Inactive"),
      }),
      columnHelper.accessor((row) => row.roles.join(", "), {
        id: "roles",
        header: () => <span>Roles</span>,
        cell: (info) => info.getValue(),
      }),
    ];

    if (props.users.some((u) => u.organization)) {
      base.unshift(
        columnHelper.accessor((row) => row.organization?.name, {
          id: "organization",
          header: () => <span>Organization</span>,
          cell: (info) => info.getValue(),
        }),
      );
    }

    return base;
  }, [props.users]);

  return (
    <Table<UserWithOrgName>
      columns={columns}
      data={props.users}
      totalNumberOfRecords={props.users.length}
      navigationAction={props.navigationAction}
    />
  );
};
