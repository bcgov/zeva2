import { getVehicles, VehicleSparse } from "../data";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { VehicleTable } from "./VehicleTable";
import { getUserInfo } from "@/auth";
import { ReactNode } from "react";

export type VehicleSparseSerialized = Omit<
  VehicleSparse,
  "numberOfUnits" | "isActive"
> & {
  numberOfUnits: string | undefined;
};

export const VehicleList = async (props: {
  type: "active" | "inactive",
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
  headerContent?: ReactNode;
}) => {
  const { userIsGov } = await getUserInfo();
  const navigationAction = async (id: number) => {
    "use server";
    if (props.type === "active") {
      redirect(`${Routes.ActiveZevModels}/${id}`);
    } else if (props.type === "inactive") {
      redirect(`${Routes.InactiveZevModels}/${id}`);
    }
  };
  const [vehicles, totalNumberOfVehicles] = await getVehicles(
    props.type,
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
      };
    },
  );
  return (
    <VehicleTable
      vehicles={serializedVehicles}
      totalNumbeOfVehicles={totalNumberOfVehicles}
      navigationAction={navigationAction}
      userIsGov={userIsGov}
      headerContent={props.headerContent}
    />
  );
};
