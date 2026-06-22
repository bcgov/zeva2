import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { VehicleForm } from "../lib/components/VehicleForm";

const Page = async () => {
  return (
    <div className="p-4">
      <Breadcrumbs
        items={[
          { label: "ZEV Models", href: Routes.SubmittedZevModels },
          { label: "New Vehicle" },
        ]}
      />
      <h1 className="mb-6 mt-4 text-2xl font-bold text-primaryText">
        Create a Vehicle
      </h1>
      <VehicleForm variant="full" />
    </div>
  );
};

export default Page;
