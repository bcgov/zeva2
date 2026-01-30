import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import { LegacySupplementariesList } from "./lib/components/LegacySupplementariesList";

// todo: since there should be a minimal number of legacy supplementary reports over time, we will
// transition to using the "client-side" table when it becomes available.
const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov } = await getUserInfo();
  const searchParams = await props.searchParams;
  const { page, pageSize } = getPageParams(searchParams, 1, 10);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {!userIsGov && (
        <Link href={`${Routes.LegacySupplementary}/new`}>
          <Button>Create a Legacy Supplementary Report</Button>
        </Link>
      )}
      <LegacySupplementariesList page={page} pageSize={pageSize} />
    </Suspense>
  );
};

export default Page;
