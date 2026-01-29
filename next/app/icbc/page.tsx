import { getUserInfo } from "@/auth";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { Role } from "@/prisma/generated/client";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { IcbcFilesList } from "./lib/components/IcbcFilesList";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER) && (
        <Link href={`${Routes.Icbc}/new`}>
          <Button variant="primary">Upload ICBC File</Button>
        </Link>
      )}
      <IcbcFilesList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
