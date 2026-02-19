"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import {
  GovUserCategory,
  SupplierUserCategory,
  UserWithOrgName,
} from "../data";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { Idp } from "@/prisma/generated/enums";

export interface UserTableProps {
  users: UserWithOrgName[];
  userIsGov: boolean;
  category: GovUserCategory | SupplierUserCategory;
}

export const UserTable = ({ users, userIsGov, category }: UserTableProps) => {
  const router = useRouter();
  const navigationAction = useCallback((id: number) => {
    router.push(`${Routes.Users}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<UserWithOrgName>();

  const rolesMap = useMemo(() => {
    return getRoleEnumsToStringsMap();
  }, []);

  const idpMap = useMemo(() => {
    return {
      [Idp.AZURE_IDIR]: "IDIR",
      [Idp.BCEID_BUSINESS]: "BCeID",
    };
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
        header: () => <span>Email</span>,
        cell: (info) => {
          const email = info.getValue();
          const canCopy = Boolean(email);
          return (
            <div className="flex items-center gap-2">
              <span className="truncate">{email || "—"}</span>
              {canCopy && (
                <button
                  type="button"
                  aria-label="Copy email address"
                  className="text-gray-500 hover:text-primaryBlue"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigator.clipboard?.writeText(email);
                  }}
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              )}
            </div>
          );
        },
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
      if (category === "inactive") {
        base.unshift(
          columnHelper.accessor((row) => idpMap[row.idp], {
            id: "idp",
            header: () => <span>User Type</span>,
            enableSorting: true,
            enableColumnFilter: true,
          }),
        );
      }
      if (category === "bceid" || category === "inactive") {
        base.unshift(
          columnHelper.accessor((row) => row.organization.name, {
            id: "organization",
            header: () => <span>Organization</span>,
            enableSorting: true,
            enableColumnFilter: true,
          }),
        );
      }
    }
    return base;
  }, [columnHelper, rolesMap, userIsGov, category]);

  return (
    <ClientSideTable<UserWithOrgName>
      columns={columns}
      data={users}
      navigationAction={navigationAction}
      stackHeaderContents={true}
      enableFiltering={true}
      enableSorting={true}
    />
  );
};
