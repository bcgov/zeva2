import { getUserInfo } from "@/auth";
import { VehicleWithOrg } from "../data";

type VehicleProps = {
  vehicle: VehicleWithOrg;
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
    const { userIsGov } = await getUserInfo();
    return (
      <ul className="space-y-3">
        <li key="id">ID: {vehicle.id}</li>
        {vehicle.legacyId && (
          <li key="legacyId">Legacy ID: {vehicle.legacyId}</li>
        )}
        <li key="status">Status: {statusMap[vehicle.status]}</li>
        <li key="isActive">Is Active: {vehicle.isActive ? "Yes" : "No"}</li>
        {userIsGov && (
          <li key="supplier">Supplier: {vehicle.organization.name} </li>
        )}
        <li key="vehicleMake">Make: {vehicle.make}</li>
        <li key="vehicleModel">Model: {vehicle.modelName}</li>
        <li key="modelYear">Model Year: {modelYearsMap[vehicle.modelYear]}</li>
        <li key="zevType">ZEV Type: {vehicle.zevType}</li>
        <li key="passedTest">
          US06 Range at least 16 km:{" "}
          {vehicle?.us06RangeGte16 ? "Yes" : "No or Unknown"}
        </li>
        <li key="bodyType">Body Type: {vehicle.vehicleClassCode}</li>
        <li key="range">Electric EPA Range (km): {vehicle.range}</li>
        <li key="weigt=ht"> Weight (kg): {vehicle.weight}</li>
        <li key="vehicleClass">
          Vehicle Class: {vehicleClassesMap[vehicle.vehicleClass]}
        </li>
        <li key="zevClass">Zev Class: {zevClassesMap[vehicle.zevClass]}</li>
        <li key="credits">
          Credit Entitlement: {vehicle.numberOfUnits.toString()}
        </li>
      </ul>
    );
  }
};
