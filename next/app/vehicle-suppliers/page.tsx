import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { OrganizationList } from "./lib/components/OrganizationList";
import { Role } from "@/prisma/generated/enums";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const canCreateNewOrg = userRoles.includes(Role.ADMINISTRATOR);
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OrganizationList canCreateNewOrg={canCreateNewOrg} />
    </Suspense>
  );
};

export default Page;
