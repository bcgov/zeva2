import { getUserInfo } from "@/auth";
import { UserForm } from "@/app/administration/lib/components/UserForm";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { getGovOrgId } from "@/app/vehicle-suppliers/lib/data";
import { userIsAdmin } from "@/app/administration/lib/utilsServer";

const Page = async (props: {
  searchParams: Promise<{ organizationId?: string }>;
}) => {
  const isAdmin = await userIsAdmin();
  if (!isAdmin) {
    return null;
  }
  const searchParams = await props.searchParams;
  const { userOrgId } = await getUserInfo();
  const govOrgId = await getGovOrgId();
  let orgsMap = await getOrgsMap(null, false);
  let initialOrganizationId: string | undefined;
  const queryOrganizationId = Number.parseInt(
    searchParams.organizationId ?? "",
    10,
  );
  if (!Number.isNaN(queryOrganizationId) && orgsMap[queryOrganizationId]) {
    initialOrganizationId = queryOrganizationId.toString();
  }
  return (
    <div className="w-full">
      <div className="p-4 bg-gray-100 text-2xl font-bold">New User</div>
      <UserForm
        orgsMap={orgsMap}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
        initialOrganizationId={initialOrganizationId}
        isAdmin={true}
      />
    </div>
  );
};

export default Page;
