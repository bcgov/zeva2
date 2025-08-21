import { Suspense } from "react";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { CreditApplicationList } from "./lib/components/CreditApplicationList";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov } = await getUserInfo();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {!userIsGov && (
        <Link href={`${Routes.CreditApplication}/new`}>
          <Button>Submit a Credit Application</Button>
        </Link>
      )}
      <CreditApplicationList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
