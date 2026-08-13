import { getUserInfo } from "@/auth";
import { getOrganizationDetails } from "@/app/vehicle-suppliers/lib/services";
import { Role } from "@/prisma/generated/enums";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { Button } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { userIsAdmin } from "../../lib/utilsServer";

const Page = async () => {
  const { userOrgId } = await getUserInfo();

  const organization = await getOrganizationDetails(userOrgId);
  if (!organization) {
    return null;
  }

  const isAdmin = await userIsAdmin();
  const rolesMap = getRoleEnumsToStringsMap();

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div>
          <Link href={`${Routes.Administration}/new`}>
            <Button
              variant="secondary"
              icon={<FontAwesomeIcon icon={faPlus} />}
            >
              Add User
            </Button>
          </Link>
        </div>
      )}

      {organization.users.length === 0 ? (
        <p className="text-secondaryText">No users found.</p>
      ) : (
        <div className="flex flex-col border border-dividerMedium rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dividerMedium bg-disabledBG">
                <th className="px-5 py-3 text-left font-bold">Name</th>
                <th className="px-5 py-3 text-left font-bold">Status</th>
                <th className="px-5 py-3 text-left font-bold">Roles</th>
              </tr>
            </thead>
            <tbody>
              {organization.users.map((user, index) => (
                <tr
                  key={user.id}
                  className={
                    index < organization.users.length - 1
                      ? "border-b border-dividerMedium"
                      : ""
                  }
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`${Routes.Administration}/${user.id}`}
                      className="text-link hover:underline"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {user.isActive ? "Active" : "Inactive"}
                  </td>
                  <td className="px-5 py-3">
                    {user.roles.map((role) => rolesMap[role]).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Page;
