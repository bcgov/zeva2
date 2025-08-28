import { Button, ContentCard } from "@/app/lib/components";
import Link from "next/link";
import { getUser } from "../lib/data";
import { Routes } from "@/app/lib/constants";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const user = await getUser(id);
  if (!user) {
    return null;
  }
  const rolesMap = getRoleEnumsToStringsMap();
  const roles = user.roles.map((role) => {
    return rolesMap[role] ?? "";
  });
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="User Details">
        <div>
          <Link href={`${Routes.Users}/${id}/edit`}>
            <Button>Edit</Button>
          </Link>
          <ul>
            <li key="organization">Organization: {user.organization.name}</li>
            <li key="firstName">First Name: {user.firstName}</li>
            <li key="lastName">Last Name: {user.lastName}</li>
            <li key="isActive">
              Is Active: {user.isActive ? "True" : "False"}
            </li>
            <li key="idpUsername">IDP Username: {user.idpUsername}</li>
            <li key="roles">Roles: {roles.join(", ")}</li>
          </ul>
        </div>
      </ContentCard>
    </div>
  );
};

export default Page;
