import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import { OrganizationList } from "./lib/components/OrganizationList";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { Role } from "@/prisma/generated/client";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { userIsGov, userRoles } = await getUserInfo();

  if (!userIsGov) {
    return (
      <div className="p-6 font-semibold">
        You do not have access to this page.
      </div>
    );
  }

  const canCreateNewOrg = userRoles.includes(Role.ADMINISTRATOR);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {canCreateNewOrg && (
        <a href={`${Routes.VehicleSuppliers}/new`}>
          <Button
            variant="primary"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            } // An example of how to add an icon to the button. Not sure where we want to get our icons from.
            iconPosition="left"
          >
            New Supplier
          </Button>
        </a>
      )}
      <OrganizationList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
