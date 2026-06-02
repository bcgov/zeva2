"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Button, ClientSideTable } from "@/app/lib/components";
import { AgreementWithOrgNameSerialized } from "../utilsServer";
import {
  getAgreementStatusEnumsToStringsMap,
  getAgreementTypeEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { useRouter } from "next/navigation";

export const AgreementTable = (props: {
  agreements: AgreementWithOrgNameSerialized[];
  userIsGov: boolean;
  canCreateAgreement: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.CreditAgreements}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<AgreementWithOrgNameSerialized>();
  const statusMap = useMemo(() => {
    return getAgreementStatusEnumsToStringsMap();
  }, []);
  const typeMap = useMemo(() => {
    return getAgreementTypeEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<AgreementWithOrgNameSerialized, any>[] = [
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: props.userIsGov,
        enableColumnFilter: props.userIsGov,
        header: "Status",
      }),
      columnHelper.accessor((row) => row.date, {
        id: "date",
        enableSorting: true,
        enableColumnFilter: true,
        header: "Date",
      }),
      columnHelper.accessor((row) => typeMap[row.agreementType], {
        id: "agreementType",
        enableSorting: true,
        enableColumnFilter: true,
        header: "Type",
      }),
      columnHelper.accessor((row) => row.aCredits, {
        id: "aCredits",
        enableSorting: true,
        enableColumnFilter: true,
        header: "A-Credits",
      }),
      columnHelper.accessor((row) => row.bCredits, {
        id: "bCredits",
        enableSorting: true,
        enableColumnFilter: true,
        header: "B-Credits",
      }),
    ];
    if (props.userIsGov) {
      result.unshift(
        columnHelper.accessor((row) => row.organization.name, {
          id: "organization",
          enableSorting: true,
          enableColumnFilter: true,
          header: "Supplier",
        }),
      );
    }
    result.unshift(
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
    );
    return result;
  }, [columnHelper]);

  return (
    <ClientSideTable<AgreementWithOrgNameSerialized>
      columns={columns}
      data={props.agreements}
      enableFiltering={true}
      enableSorting={true}
      navigationAction={navigationAction}
      headerContent={
        props.canCreateAgreement && (
          <Link href={`${Routes.CreditAgreements}/new`}>
            <Button variant="primary">Create a New Agreement</Button>
          </Link>
        )
      }
    />
  );
};
