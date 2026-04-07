import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import OrganizationEditForm from "../lib/components/OrganizationEditForm";

const Page = async () => {
  const handleCancel = async () => {
    "use server";
    redirect(Routes.VehicleSuppliers);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <OrganizationEditForm
          formHeading="New Vehicle Supplier"
          submitButtonText="Create"
          isActive={true}
          handleCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default Page;
