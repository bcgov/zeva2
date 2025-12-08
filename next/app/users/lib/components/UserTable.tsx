"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import type { UserWithOrgName } from "../data";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export interface UserTableProps {
  users: UserWithOrgName[];
  totalCount: number;
  userIsGov: boolean;
}

export default function UserTable({
  users,
  totalCount,
  userIsGov,
}: UserTableProps) {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.Users}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<UserWithOrgName>();

  const rolesMap = useMemo(() => {
    return getRoleEnumsToStringsMap();
  }, []);

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
      columnHelper.accessor(
        (row) => row.roles.map((role) => rolesMap[role]).join(", "),
        {
          id: "roles",
          header: () => <span>Roles</span>,
          cell: (info) => info.getValue(),
          enableSorting: false,
          enableColumnFilter: true,
        },
      ),
    ];

    if (userIsGov) {
      base.unshift(
        columnHelper.accessor((row) => row.organization?.name, {
          id: "organization",
          header: () => <span>Organization</span>,
          cell: (info) => info.getValue(),
          enableSorting: true,
          enableColumnFilter: true,
        }),
      );
    }
    return base;
  }, [users, userIsGov]);

  return (
    <Table<UserWithOrgName>
      columns={columns}
      data={users}
      totalNumberOfRecords={totalCount}
      navigationAction={navigationAction}
    />
  );
}
