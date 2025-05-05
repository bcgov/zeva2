import React from "react";
import { getVehicles, VehicleSparse } from "../data";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { VehicleTable } from "./VehicleTable";

export type VehicleSparseSerialized = Omit<
  VehicleSparse,
  "creditValue" | "isActive"
> & {
  creditValue: string | undefined;
  isActive: string;
};

export const VehicleList = async (props: {
  page: number;
  pageSize: number;
  filters: { [key: string]: string };
  sorts: { [key: string]: string };
}) => {
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.Vehicle}/${id}`);
  };
  const [vehicles, totalNumberOfVehicles] = await getVehicles(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  // serialize/transform certain fields
  const serializedVehicles: VehicleSparseSerialized[] = vehicles.map(
    (vehicle) => {
      return {
        ...vehicle,
        creditValue: vehicle.creditValue?.toString(),
        isActive: vehicle.isActive ? "Yes" : "No",
      };
    },
  );
  return (
    <VehicleTable
      vehicles={serializedVehicles}
      totalNumbeOfVehicles={totalNumberOfVehicles}
      navigationAction={navigationAction}
    />
  );
};
