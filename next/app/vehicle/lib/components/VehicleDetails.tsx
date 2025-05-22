import { Vehicle } from "@/prisma/generated/client";
type VehicleProps = {
  id: number;
  vehicle: Vehicle;
};

const VehicleDetails = async ({ id, vehicle }: VehicleProps) => {
  if (vehicle) {
    return (
      <div key={vehicle.id}>
        <ul>
          <li key="validationStatus">Validation Status: {vehicle.status}</li>
          <li key="supplier">Supplier: {vehicle.organization.name} </li>
          <li key="modelYear">Model Year: {vehicle.modelYear}</li>
          <li key="vehicleMake">Make: {vehicle.make}</li>
          <li key="vehicleModel">Model: {vehicle.modelName}</li>
          <li key="zevType">ZEV Type: {vehicle.vehicleZevType}</li>
          <li key="passedTest">
            Has passed US06 Test: {vehicle?.hasPassedUs06Test}
          </li>
          <li key="bodyType">Body Type: {vehicle.vehicleClassCode}</li>
          <li key="range">Electric EPA Range (km): {vehicle.range}</li>
          <li key="weigt=ht"> Weight (kg): {vehicle.weightKg.toString()}</li>
          {/* <li key="vehicleClass">Vehicle Class: {vehicle.vehicleClass}</li>  */}
          <li key="zevClass">Zev Class: {vehicle.zevClass}</li>
          <li key="credits">
            Credit Entitlement: {vehicle.creditValue?.toString()}
          </li>
        </ul>
      </div>
    );
  }
};

export default VehicleDetails;
