"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
  getReassessmentStatusEnumsToStringsMap,
  getSupplementaryReportStatusEnumsToStringsMap,
  getSupplierClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { MyrRecordSerialized } from "../constants";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { IsCompliant } from "../constants";

export const ReportsTable = (props: {
  myrs: MyrRecordSerialized[];
  userIsGov: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.ComplianceReporting}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<MyrRecordSerialized>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getMyrStatusEnumsToStringsMap();
  }, []);
  const reassessmentStatusMap = useMemo(() => {
    return getReassessmentStatusEnumsToStringsMap();
  }, []);
  const supplementaryStatusMap = useMemo(() => {
    return getSupplementaryReportStatusEnumsToStringsMap();
  }, []);
  const supplierClassesMap = useMemo(() => {
    return getSupplierClassEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<MyrRecordSerialized, any>[] = [
      columnHelper.accessor((row) => modelYearEnumMap[row.modelYear], {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor(
        (row) =>
          row.reassessmentStatus
            ? reassessmentStatusMap[row.reassessmentStatus]
            : "--",
        {
          id: "reassessmentStatus",
          enableSorting: props.userIsGov,
          enableColumnFilter: true,
          header: () => <span>Reassessment Status</span>,
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.supplementaryReportStatus
            ? supplementaryStatusMap[row.supplementaryReportStatus]
            : "--",
        {
          id: "supplementaryReportStatus",
          enableSorting: !props.userIsGov,
          enableColumnFilter: true,
          header: () => <span>Supplementary Report Status</span>,
        },
      ),
      columnHelper.accessor(
        (row) => {
          const value = row.compliant;
          if (value === null) {
            return "--";
          } else if (value) {
            return IsCompliant.Yes;
          } else {
            return IsCompliant.No;
          }
        },
        {
          id: "compliant",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Compliant</span>,
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.supplierClass ? supplierClassesMap[row.supplierClass] : "--",
        {
          id: "supplierClass",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Supplier Class</span>,
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.reportableNvValue ? row.reportableNvValue.toString() : "--",
        {
          id: "reportableNvValue",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Reportable NV Value</span>,
        },
      ),
    ];
    if (props.userIsGov) {
      result.unshift(
        columnHelper.accessor((row) => row.orgName, {
          id: "organization",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Supplier</span>,
        }),
      );
    }
    result.unshift(
      columnHelper.accessor((row) => row.id.toString(), {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
    );
    return result;
  }, [columnHelper, props.myrs, props.userIsGov]);

  return (
    <ClientSideTable<MyrRecordSerialized>
      columns={columns}
      data={props.myrs}
      enableFiltering={true}
      enableSorting={true}
      navigationAction={navigationAction}
    />
  );
};
