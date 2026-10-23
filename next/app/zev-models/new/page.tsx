import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { VehicleForm } from "../lib/components/VehicleForm";
import { getUserInfo } from "@/auth";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  return (
    <div className="p-4">
      <Breadcrumbs
        items={[
          { label: "ZEV Models", href: Routes.InProgressZevModels },
          { label: "New Vehicle" },
        ]}
      />
      <h1 className="mb-6 mt-4 text-2xl font-bold text-primaryText">
        Create a Vehicle
      </h1>
      <VehicleForm />
    </div>
  );
};

export default Page;
