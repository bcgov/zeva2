"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { VehicleSparseSerialized } from "./VehicleList";
import {
  getModelYearEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const VehicleTable = (props: {
  vehicles: VehicleSparseSerialized[];
  totalNumbeOfVehicles: number;
  navigationAction: (id: number) => Promise<void>;
}) => {
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
        enableSorting: true,
        enableColumnFilter: true,
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
      columnHelper.accessor((row) => row.vehicleZevType, {
        id: "vehicleZevType",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ZEV Type</span>,
      }),
      columnHelper.accessor((row) => row.isActive, {
        id: "isActive",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Active</span>,
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
    if (
      props.vehicles.some((vehicle) => {
        return vehicle.organization ? true : false;
      })
    ) {
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
  }, [columnHelper, props.vehicles]);

  return (
    <Table<VehicleSparseSerialized>
      columns={columns}
      data={props.vehicles}
      totalNumberOfRecords={props.totalNumbeOfVehicles}
      navigationAction={props.navigationAction}
    />
  );
};
