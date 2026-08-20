import { getVehicles } from "../data";
import { redirect } from "next/navigation";
import { VehicleTable } from "./VehicleTable";
import { getUserInfo } from "@/auth";
import { ReactNode } from "react";
import { getZevModelTabRoute } from "@/app/zev-models/lib/routes";
import { ZevModelTab, VehicleSparseSerialized } from "../constants";

export const VehicleList = async (props: {
  type: ZevModelTab;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
  headerContent?: ReactNode;
}) => {
  const { userIsGov } = await getUserInfo();
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${getZevModelTabRoute(props.type)}/${id}`);
  };
  const [vehicles, totalNumberOfVehicles] = await getVehicles(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
    props.type,
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
      type={props.type}
      vehicles={serializedVehicles}
      totalNumbeOfVehicles={totalNumberOfVehicles}
      navigationAction={navigationAction}
      userIsGov={userIsGov}
      headerContent={props.headerContent}
    />
  );
};
