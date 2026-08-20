import { getVehicles } from "@/app/zev-models/lib/data";
import { redirect } from "next/navigation";
import { VehicleTable } from "@/app/zev-models/lib/components/VehicleTable";
import { getZevModelTabRoute } from "@/app/zev-models/lib/routes";
import { VehicleSparseSerialized } from "@/app/zev-models/lib/constants";
import { getTabType } from "@/app/zev-models/lib/services";

export const VehicleList = async (props: {
  orgId: number;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
  const navigationAction = async (id: number) => {
    "use server";
    const tab = await getTabType(id);
    if (tab) {
      redirect(`${getZevModelTabRoute(tab)}/${id}`);
    }
  };
  const [vehicles, totalNumberOfVehicles] = await getVehicles(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
    undefined,
    props.orgId,
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
      type="supplierSpecific"
      vehicles={serializedVehicles}
      totalNumbeOfVehicles={totalNumberOfVehicles}
      navigationAction={navigationAction}
      userIsGov={true}
    />
  );
};
