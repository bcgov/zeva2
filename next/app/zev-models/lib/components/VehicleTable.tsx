"use client";

import { ReactNode, useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { VehicleSparseSerialized, ZevModelTab } from "../constants";
import {
  getModelYearEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { getZevModelTabRoute } from "../routes";
import { getVehicleRoute } from "@/app/vehicle-suppliers/lib/actions";

export const VehicleTable = (props: {
  type: ZevModelTab | "supplierSpecific";
  vehicles: VehicleSparseSerialized[];
  totalNumbeOfVehicles: number;
  userIsGov: boolean;
  headerContent?: ReactNode;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(
    async (id: number) => {
      if (props.type === "supplierSpecific") {
        const response = await getVehicleRoute(id);
        if (response.responseType === "data") {
          router.push(response.data);
        }
      } else {
        router.push(`${getZevModelTabRoute(props.type)}/${id}`);
      }
    },
    [props.type],
  );
  const columnHelper = createColumnHelper<VehicleSparseSerialized>();
  const modelYearEnumMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const statusMap = useMemo(() => {
    return getVehicleStatusEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<VehicleSparseSerialized, any>[] = [
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting:
          (!props.userIsGov && props.type === "submitted") ||
          (props.userIsGov && props.type === "supplierSpecific"),
        enableColumnFilter:
          (!props.userIsGov && props.type === "submitted") ||
          (props.userIsGov && props.type === "supplierSpecific"),
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => row.numberOfUnits, {
        id: "numberOfUnits",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Number of Credits</span>,
      }),
      columnHelper.accessor((row) => row.zevClass, {
        id: "zevClass",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ZEV Class</span>,
      }),
      columnHelper.accessor((row) => modelYearEnumMap[row.modelYear], {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => row.modelName, {
        id: "modelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model</span>,
      }),
      columnHelper.accessor((row) => row.make, {
        id: "make",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Make</span>,
      }),
      columnHelper.accessor((row) => row.range, {
        id: "range",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Range (km)</span>,
      }),
      columnHelper.accessor((row) => row.zevType, {
        id: "zevType",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ZEV Type</span>,
      }),
      columnHelper.accessor((row) => row.submittedCount, {
        id: "submittedCount",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Submitted Count</span>,
      }),
      columnHelper.accessor((row) => row.issuedCount, {
        id: "issuedCount",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Issued Count</span>,
      }),
    ];
    if (props.userIsGov && props.type !== "supplierSpecific") {
      result.unshift(
        columnHelper.accessor((row) => row.organization?.name, {
          id: "organization",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Supplier</span>,
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
      columnHelper.accessor((row) => row.legacyId, {
        id: "legacyId",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Legacy ID</span>,
      }),
    );
    return result;
  }, [columnHelper, props.userIsGov, props.type, props.vehicles]);

  return (
    <Table<VehicleSparseSerialized>
      columns={columns}
      data={props.vehicles}
      totalNumberOfRecords={props.totalNumbeOfVehicles}
      defaultPageSize={10}
      navigationAction={navigationAction}
      headerContent={props.headerContent}
    />
  );
};
