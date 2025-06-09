"use client";

import React, { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { Role } from "@/prisma/generated/client";

interface UserRow {
  id: number;
  firstName: string;
  lastName: string;
  contactEmail: string;
  idpEmail: string;
  idpUsername: string;
  isActive: boolean;
  roles: Role[];
  organization?: {
    name: string;
  };
}

export const UserTable = (props: {
  users: UserRow[];
  navigationAction: (id: number) => Promise<void>;
}) => {
  const columnHelper = createColumnHelper<UserRow>();

  const columns = useMemo(() => {
    const base: ColumnDef<UserRow, any>[] = [
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
        })
      );
    }

    return base;
  }, [props.users]);

  return (
    <Table<UserRow>
      columns={columns}
      data={props.users}
      totalNumberOfRecords={props.users.length}
      navigationAction={props.navigationAction}
    />
  );
};
