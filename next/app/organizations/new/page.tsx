import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { createOrganization, OrganizationPayload } from "../lib/action";
import OrganizationEditForm from "../lib/components/OrganizationEditForm";

const createNew = async (data: OrganizationPayload) => {
  "use server";
  const createdOrganization = await createOrganization(data);
  if (createdOrganization) {
    redirect(Routes.VehicleSuppliers);
  } else {
    redirect(`${Routes.VehicleSuppliers}/error`);
  }
};

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
          upsertData={createNew}
          handleCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default Page;
