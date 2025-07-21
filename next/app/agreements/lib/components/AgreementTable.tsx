"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { AgreementSparse } from "../data";
import { getIsoYmdStringInUtc } from "@/app/lib/utils/date";
import { enumToTitleString } from "@/lib/utils/convertEnums";

export const AgreementTable = (props: {
  agreements: AgreementSparse[];
  totalNumberOfAgreements: number;
  navigationAction: (id: number) => Promise<void>;
}) => {
  const columnHelper = createColumnHelper<AgreementSparse>();

  const columns = useMemo(() => {
    const result: ColumnDef<AgreementSparse, any>[] = [
      columnHelper.accessor((row) => row.agreementType[0] + "A-" + row.id, {
        id: "agreementId",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "ID",
      }),
      columnHelper.accessor((row) => row.referenceId, {
        id: "referenceId",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "Ref. ID",
      }),
      columnHelper.accessor((row) =>
        row.effectiveDate ? getIsoYmdStringInUtc(row.effectiveDate) : "",
      {
        id: "effectiveDate",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "Date",
      }),
      columnHelper.accessor((row) => row.organization.shortName, {
        id: "supplier",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "Supplier",
      }),
      columnHelper.accessor((row) => row.agreementType, {
        id: "agreementType",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: "Type",
      }),
      columnHelper.accessor((row) => row.creditA.toFixed(2), {
        id: "creditA",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (info) => <div className="text-right">{info.getValue()}</div>,
        header: "A-Credit",
      }),
      columnHelper.accessor((row) => row.creditB.toFixed(2), {
        id: "creditB",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (info) => <div className="text-right">{info.getValue()}</div>,
        header: "B-Credit",
      }),
      columnHelper.accessor((row) => row.status, {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => <div className="text-center">{enumToTitleString(info.getValue())}</div>,
        header: "Status",
      }),
    ];

    return result;
  }, [columnHelper]);

  return (
    <Table<AgreementSparse>
      columns={columns}
      data={props.agreements}
      totalNumberOfRecords={props.totalNumberOfAgreements}
      navigationAction={props.navigationAction}
    />
  );
};
