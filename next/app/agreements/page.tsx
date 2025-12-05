import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import { AgreementList } from "./lib/components/AgreementList";
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

  const canCreateNewAgreement = userRoles.includes(Role.ENGINEER_ANALYST);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {canCreateNewAgreement && (
        <a href={`${Routes.CreditAgreements}/new`}>
          <Button variant="primary">New Agreement</Button>
        </a>
      )}
      <AgreementList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
