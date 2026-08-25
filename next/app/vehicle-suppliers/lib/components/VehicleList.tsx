import { getVehicles } from "@/app/zev-models/lib/data";
import { VehicleTable } from "@/app/zev-models/lib/components/VehicleTable";
import { VehicleSparseSerialized } from "@/app/zev-models/lib/constants";

export const VehicleList = async (props: {
  orgId: number;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
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
      userIsGov={true}
    />
  );
};
