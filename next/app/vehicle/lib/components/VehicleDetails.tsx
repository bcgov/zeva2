import { SerializedVehicleWithOrg } from "../data";

type VehicleProps = {
  vehicle: SerializedVehicleWithOrg;
};
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
export const VehicleDetails = async ({ vehicle }: VehicleProps) => {
  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const statusMap = getVehicleStatusEnumsToStringsMap();
  if (vehicle) {
    return (
      <div key={vehicle.id}>
        <ul>
          <li key="validationStatus">
            Validation Status: {statusMap[vehicle.status]}
          </li>
          <li key="supplier">Supplier: {vehicle.organization.name} </li>
          <li key="modelYear">
            Model Year: {modelYearsMap[vehicle.modelYear]}
          </li>
          <li key="vehicleMake">Make: {vehicle.make}</li>
          <li key="vehicleModel">Model: {vehicle.modelName}</li>
          <li key="zevType">ZEV Type: {vehicle.vehicleZevType}</li>
          <li key="passedTest">
            Has passed US06 Test: {vehicle?.hasPassedUs06Test ? "Yes" : "No"}
          </li>
          <li key="bodyType">Body Type: {vehicle.vehicleClassCode}</li>
          <li key="range">Electric EPA Range (km): {vehicle.range}</li>
          <li key="weigt=ht"> Weight (kg): {vehicle.weightKg}</li>
          <li key="vehicleClass">
            Vehicle Class: {vehicleClassesMap[vehicle.vehicleClass]}
          </li>
          <li key="zevClass">Zev Class: {zevClassesMap[vehicle.zevClass]}</li>
          <li key="credits">Credit Entitlement: {vehicle.numberOfUnits}</li>
        </ul>
      </div>
    );
  }
};
