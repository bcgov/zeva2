import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import { AgreementList } from "./lib/components/AgreementList";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { Role } from "@/prisma/generated/enums";
import Link from "next/link";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  const canCreateNewAgreement =
    userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {canCreateNewAgreement && (
        <Link href={`${Routes.CreditAgreements}/new`}>
          <Button variant="primary">Create a New Agreement</Button>
        </Link>
      )}
      <AgreementList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
        userIsGov={userIsGov}
      />
    </Suspense>
  );
};

export default Page;
