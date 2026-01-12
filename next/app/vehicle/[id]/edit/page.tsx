import { Suspense } from "react";
import { VehicleEdit } from "../../lib/components/VehicleEdit";

const Page = async (props: { vehicleId?: number }) => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit a Vehicle</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <Suspense>
          <VehicleEdit />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;
