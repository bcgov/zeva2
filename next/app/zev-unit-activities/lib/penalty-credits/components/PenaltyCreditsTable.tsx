"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Button, ClientSideTable } from "@/app/lib/components";
import { useCallback, useMemo } from "react";
import { PenaltyCreditSparse } from "../data";
import {
  getModelYearEnumsToStringsMap,
  getPenaltyCreditStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { useRouter } from "next/navigation";

export const PenaltyCreditsTable = (props: {
  credits: PenaltyCreditSparse[];
  canCreatePenaltyCredits: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.PenaltyCredits}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<PenaltyCreditSparse>();
  const columns = useMemo(() => {
    const modelYearsMap = getModelYearEnumsToStringsMap();
    const statusesMap = getPenaltyCreditStatusEnumsToStringsMap();
    const result: ColumnDef<PenaltyCreditSparse, any>[] = [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => modelYearsMap[row.complianceYear], {
        id: "complianceYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Compliance Year</span>,
      }),
      columnHelper.accessor((row) => statusesMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => row.organization.name, {
        id: "organization",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Organization</span>,
      }),
    ];
    return result;
  }, [columnHelper, props.credits]);
  return (
    <ClientSideTable<PenaltyCreditSparse>
      columns={columns}
      data={props.credits}
      navigationAction={navigationAction}
      enableFiltering={true}
      enableSorting={true}
      headerContent={
        props.canCreatePenaltyCredits && (
          <Link href={`${Routes.PenaltyCredits}/new`}>
            <Button variant="primary">Create New Penalty Credit</Button>
          </Link>
        )
      }
    />
  );
};
