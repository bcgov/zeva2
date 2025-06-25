import { Routes } from "@/app/lib/constants";
import { createOrUpdateVehicle, VehiclePayload } from "../lib/actions";
import { VehicleForm } from "../lib/components/VehicleForm";
import { redirect } from "next/navigation";

const Page = async () => {
  const handleSave = async (data: VehiclePayload) => {
    "use server";
    const newVehicleId = await createOrUpdateVehicle(data);
    if (newVehicleId) {
      redirect(`${Routes.Vehicle}/${newVehicleId}`);
    }
  };
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add a New Vehicle</h1>
      <VehicleForm handleSave={handleSave} />
    </div>
  );
};

export default Page;
