import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { AddressType } from "@/prisma/generated/client";
import { getOrganizationDetails } from "../lib/services";
import OrganizationDetails from "../lib/components/OrganizationDetails";
import { getSupplierClass } from "../lib/utils";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const orgId = parseInt(id, 10);
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

  const serviceAddress = organization.organizationAddress.find(
    (item) => item.addressType === AddressType.SERVICE,
  );
  const recordsAddress = organization.organizationAddress.find(
    (item) => item.addressType === AddressType.RECORDS,
  );

  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <OrganizationDetails
          organizationName={organization.name}
          firstModelYear={organization.firstModelYear.toString().substring(3)}
          serviceAddress={serviceAddress}
          recordsAddress={recordsAddress}
          supplierClass={getSupplierClass(organization.ldvSupplied)}
          users={organization.users}
        />
      </Suspense>
    </div>
  );
};

export default Page;
