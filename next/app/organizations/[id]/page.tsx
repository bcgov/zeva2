import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getOrganizationDetails } from "../lib/services";
import OrganizationDetails from "../lib/components/OrganizationDetails";
import { getSupplierClass } from "../lib/utils";
import { OrganizationPayload, saveOrganization } from "../lib/action";
import { getUserInfo } from "@/auth";
import { MY_ORGANIZATION, Routes } from "@/app/lib/constants";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userOrgId, userRoles } = await getUserInfo();
  const { id } = await props.params;
  const orgId = id === MY_ORGANIZATION ? userOrgId : parseInt(id);
  const organization = isNaN(orgId)
    ? null
    : await getOrganizationDetails(orgId);
  if (!organization) {
    return (
      <div className="p-6 font-semibold">
        Organization not found or you do not have access to it.
      </div>
    );
  }

  const canEdit = userRoles.includes("ADMINISTRATOR");

  const updateOrganization = async (data: OrganizationPayload) => {
    "use server";
    const isSaved = await saveOrganization(orgId, data);
    if (isSaved) {
      revalidatePath(`${Routes.VehicleSuppliers}/${orgId}`);
    } else {
      redirect(`${Routes.VehicleSuppliers}/error`);
    }
  };

  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <OrganizationDetails
          organizationName={organization.name}
          shortName={organization.shortName ?? undefined}
          isActive={organization.isActive}
          firstModelYear={organization.firstModelYear?.toString().substring(3) ?? "N/A"}
          serviceAddress={organization.serviceAddress}
          recordsAddress={organization.recordsAddress}
          supplierClass={getSupplierClass(organization.ldvSupplied)}
          users={organization.users}
          update={canEdit ? updateOrganization : undefined}
        />
      </Suspense>
    </div>
  );
};

export default Page;
