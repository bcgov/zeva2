import { VehicleForm } from "../../lib/components/VehicleForm";
import { notFound } from "next/navigation";
import { getSerializedVehicle } from "../../lib/data";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id);
  const vehicle = await getSerializedVehicle(id);
  if (!vehicle) {
    notFound();
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit Vehicle</h1>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
};

export default Page;
