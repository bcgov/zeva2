import { VehicleForm } from "../lib/components/VehicleForm";

const Page = async () => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Submit a Vehicle</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <VehicleForm />
      </div>
    </div>
  );
};

export default Page;
