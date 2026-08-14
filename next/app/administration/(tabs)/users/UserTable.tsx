"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable, Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Role } from "@/prisma/generated/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export interface AdministrationUser {
  id: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
}

interface UserTableProps {
  users: AdministrationUser[];
  canAddUser: boolean;
}

export const UserTable = ({ users, canAddUser }: UserTableProps) => {
  const router = useRouter();
  const columnHelper = createColumnHelper<AdministrationUser>();
  const rolesMap = useMemo(() => getRoleEnumsToStringsMap(), []);

  const columns = useMemo<ColumnDef<AdministrationUser, any>[]>(
    () => [
      columnHelper.accessor(
        (user) => `${user.firstName} ${user.lastName}`.trim(),
        {
          id: "name",
          header: "Name",
          enableSorting: true,
          enableColumnFilter: true,
        },
      ),
      columnHelper.accessor(
        (user) => user.roles.map((role) => rolesMap[role]).join(", "),
        {
          id: "roles",
          header: "Roles",
          enableSorting: true,
          enableColumnFilter: true,
        },
      ),
      columnHelper.accessor((user) => (user.isActive ? "Active" : "Inactive"), {
        id: "status",
        header: "Status",
        enableSorting: true,
        enableColumnFilter: true,
      }),
    ],
    [columnHelper, rolesMap],
  );

  const navigateToUser = useCallback(
    (id: number) => router.push(`${Routes.Administration}/${id}`),
    [router],
  );

  return (
    <ClientSideTable<AdministrationUser>
      columns={columns}
      data={users}
      navigationAction={navigateToUser}
      enableFiltering
      enableSorting
      initialPageSize={10}
      customStyles={{
        container: "overflow-hidden rounded border border-dividerMedium bg-white",
        theadTh: "px-4 py-3 text-left text-sm font-semibold text-primaryText",
        tbody: "divide-y divide-dividerMedium bg-white",
        tbodyTr:
          "cursor-pointer bg-white transition-colors hover:bg-blue-50",
        tbodyTd: "px-4 py-5 text-sm text-primaryText",
        pagination:
          "flex items-center justify-between border-t border-dividerMedium bg-white px-4 py-3",
      }}
      headerContent={
        canAddUser ? (
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => router.push(`${Routes.Administration}/new`)}
          >
            New User
          </Button>
        ) : undefined
      }
    />
  );
};
