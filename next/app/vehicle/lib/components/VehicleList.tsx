import { getVehicles, VehicleSparse } from "../data";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { VehicleTable } from "./VehicleTable";

export type VehicleSparseSerialized = Omit<
  VehicleSparse,
  "numberOfUnits" | "isActive"
> & {
  numberOfUnits: string | undefined;
  isActive: string;
};

export const VehicleList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
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
        numberOfUnits: vehicle.numberOfUnits.toString(),
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
