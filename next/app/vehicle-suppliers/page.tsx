import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import { OrganizationList } from "./lib/components/OrganizationList";
import { Role } from "@/prisma/generated/enums";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { userIsGov, userRoles } = await getUserInfo();

  if (!userIsGov) {
    return null;
  }
  const canCreateNewOrg = userRoles.includes(Role.ADMINISTRATOR);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OrganizationList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
        canCreateNewOrg={canCreateNewOrg}
      />
    </Suspense>
  );
};

export default Page;
