import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getOrganizationDetails, getSupplierClassesMap } from "../lib/services";
import OrganizationDetails from "../lib/components/OrganizationDetails";
import { OrganizationPayload, saveOrganization } from "../lib/action";
import { getUserInfo } from "@/auth";
import { MY_ORGANIZATION, Routes } from "@/app/lib/constants";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupplierClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userOrgId, userRoles } = await getUserInfo();
  const { id } = await props.params;
  const orgId = id === MY_ORGANIZATION ? userOrgId : Number.parseInt(id, 10);
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
  const helpingMap = getSupplierClassEnumsToStringsMap();
  const supplierClassesMap = await getSupplierClassesMap(organization.id);
  let supplierClassResult = "N/A";
  const supplierClass = supplierClassesMap[organization.id];
  if (supplierClass && helpingMap[supplierClass]) {
    supplierClassResult = helpingMap[supplierClass];
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
          serviceAddress={organization.serviceAddress}
          recordsAddress={organization.recordsAddress}
          supplierClass={supplierClassResult}
          saleVolumes={organization.LegacySalesVolume}
          supplyVolumes={organization.SupplyVolume}
          users={organization.users}
          update={canEdit ? updateOrganization : undefined}
        />
      </Suspense>
    </div>
  );
};

export default Page;
