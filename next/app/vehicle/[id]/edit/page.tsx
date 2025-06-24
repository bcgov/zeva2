import { Routes } from "@/app/lib/constants";
import { createOrUpdateVehicle, VehiclePayload } from "../../lib/actions";
import { VehicleForm } from "../../lib/components/VehicleForm";
import { notFound, redirect } from "next/navigation";
import { getSerializedVehicle } from "../../lib/data";

const Page = async ({ params }: { params: { id: string } }) => {
  const id = parseInt(params.id);
  const vehicle = await getSerializedVehicle(id);
  if (!vehicle) {
    notFound();
  }

  const handleSave = async (data: VehiclePayload) => {
    "use server";
    const vehicleId = await createOrUpdateVehicle(data);
    if (vehicleId) {
      redirect(`${Routes.Vehicle}/${vehicleId}`);
    }
  };
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit Vehicle</h1>
      <VehicleForm handleSave={handleSave} vehicle={vehicle} />
    </div>
  );
};

export default Page;
