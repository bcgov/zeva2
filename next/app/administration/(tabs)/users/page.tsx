import { getUserInfo } from "@/auth";
import { getOrganizationDetails } from "@/app/vehicle-suppliers/lib/services";
import { BackButton } from "@/app/lib/components/BackButton";
import { userIsAdmin } from "../../lib/utilsServer";
import { UserTable } from "./UserTable";

const Page = async () => {
  const { userOrgId } = await getUserInfo();

  const organization = await getOrganizationDetails(userOrgId);
  if (!organization) {
    return null;
  }

  const isAdmin = await userIsAdmin();
  const users = organization.users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: user.roles,
  }));

  return (
    <div className="space-y-6">
      <UserTable users={users} canAddUser={isAdmin} />
      <div className="bg-gray-50 p-5">
        <BackButton />
      </div>
    </div>
  );
};

export default Page;
