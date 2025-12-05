import { Suspense } from "react";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { PenaltyCreditsList } from "./lib/components/PenaltyCreditsList";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/client";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {userIsGov && userRoles.includes(Role.ENGINEER_ANALYST) && (
        <Link href={`${Routes.PenaltyCredit}/new`}>
          <Button variant="primary">Create New Penalty Credit</Button>
        </Link>
      )}
      <PenaltyCreditsList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
