import { VehicleForm } from "../lib/components/VehicleForm";
import { createOrUpdateVehicle } from "../lib/actions";
import { VehiclePayload } from "../lib/actions";

const Page = async () => {
  const handleSave = async (data: VehiclePayload) => {
    "use server";
    const result = await createOrUpdateVehicle(data);
    if (result.responseType === "error") {
      throw new Error(result.message);
    }
    return result.data;
  };
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add a New Vehicle</h1>
      <VehicleForm handleSave={handleSave} />
    </div>
  );
};

export default Page;
