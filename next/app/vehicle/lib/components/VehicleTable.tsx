"use client";

import React, { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/app/lib/components";
import { VehicleSparseSerialized } from "./VehicleList";
import Link from "next/link";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const VehicleTable = (props: {
  vehicles: VehicleSparseSerialized[];
  totalNumbeOfVehicles: number;
  navigationAction: (id: number) => Promise<void>;
}) => {
  const columnHelper = createColumnHelper<VehicleSparseSerialized>();
  const modelYearEnumMap = getModelYearEnumsToStringsMap();
  const columns = useMemo(() => {
    const result: ColumnDef<VehicleSparseSerialized, any>[] = [
      columnHelper.accessor((row) => row.status, {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>Status</span>,
      }),
      columnHelper.accessor((row) => row.creditValue, {
        id: "creditValue",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>Credit Entitlement</span>,
      }),
      columnHelper.accessor((row) => row.zevClass, {
        id: "zevClass",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>ZEV Class</span>,
      }),
      columnHelper.accessor((row) => row.modelYear, {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => modelYearEnumMap[info.row.original.modelYear],
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => row.modelName, {
        id: "modelName",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>Model</span>,
      }),
      columnHelper.accessor((row) => row.make, {
        id: "make",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>Make</span>,
      }),
      columnHelper.accessor((row) => row.range, {
        id: "range",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>Range (km)</span>,
      }),
      columnHelper.accessor((row) => row.vehicleZevType, {
        id: "vehicleZevType",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>ZEV Type</span>,
      }),
      columnHelper.accessor((row) => row.isActive, {
        id: "isActive",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (info) => info.getValue(),
        header: () => <span>Active</span>,
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
          cell: (info) => info.getValue(),
          header: () => <span>Supplier</span>,
        }),
      );
    }
    return result;
  }, [columnHelper, props.vehicles]);

  return (
    <>
      <Link href="/vehicle/new">
        <button>Add New Vehicle</button>
      </Link>
      <Table<VehicleSparseSerialized>
        columns={columns}
        data={props.vehicles}
        totalNumberOfRecords={props.totalNumbeOfVehicles}
        navigationAction={props.navigationAction}
      />
    </>
  );
};
