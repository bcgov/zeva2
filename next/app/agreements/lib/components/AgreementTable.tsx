"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { AgreementWithOrgNameSerialized } from "../utilsServer";
import {
  getAgreementStatusEnumsToStringsMap,
  getAgreementTypeEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const AgreementTable = (props: {
  agreements: AgreementWithOrgNameSerialized[];
  totalNumberOfAgreements: number;
  navigationAction: (id: number) => Promise<void>;
  userIsGov: boolean;
}) => {
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
    <Table<AgreementWithOrgNameSerialized>
      columns={columns}
      data={props.agreements}
      totalNumberOfRecords={props.totalNumberOfAgreements}
      navigationAction={props.navigationAction}
    />
  );
};
