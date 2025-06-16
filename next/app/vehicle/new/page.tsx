import { getUserInfo } from "@/auth";
import { ContentCard } from "@/app/lib/components";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getSerializedVehicle } from "../lib/data";
import VehicleForm from "../lib/components/VehicleForm";

const New = async () => {
  const { userIsGov } = await getUserInfo();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add a New Vehicle</h1>
      <VehicleForm />
    </div>
  );
};

export default New;
