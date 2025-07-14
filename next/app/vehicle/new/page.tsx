import { VehicleForm } from "../lib/components/VehicleForm";

const Page = async () => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add a New Vehicle</h1>
      <VehicleForm />
    </div>
  );
};

export default Page;
