import { getUserInfo } from "@/auth";
import { getOrganizationDetails } from "../../lib/services";
import OrganizationDetails from "../../lib/components/OrganizationDetails";
import { getSupplierClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Role } from "@/prisma/generated/enums";

export const IndividualPage = async (props: { orgId: string }) => {
    const { userIsGov, userOrgId, userRoles } = await getUserInfo();
    const orgId = Number.parseInt(props.orgId, 10);
    if (Number.isNaN(orgId)) {
        return null;
    }
    if (!userIsGov && userOrgId !== orgId) {
        return null;
    }
    const organization = await getOrganizationDetails(orgId);
    if (!organization) {
        return null;
    }
    const supplierClassesMap = getSupplierClassEnumsToStringsMap();
      let supplierClass = "N/A";
      if (organization.supplierClass) {
        supplierClass = supplierClassesMap[organization.supplierClass] ?? "N/A";
      }
      const canEdit = userRoles.some((role) => role === Role.ADMINISTRATOR || role === Role.ORGANIZATION_ADMINISTRATOR)

    return (
        <OrganizationDetails
          organizationName={organization.name}
          shortName={organization.shortName ?? undefined}
          isActive={organization.isActive}
          serviceAddress={organization.serviceAddress}
          recordsAddress={organization.recordsAddress}
          supplierClass={supplierClass}
          saleVolumes={organization.LegacySalesVolume}
          supplyVolumes={organization.SupplyVolume}
          users={organization.users}
          canEdit={canEdit}
        />
  );
}
