import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import { LegacySupplementariesList } from "./lib/components/LegacySupplementariesList";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <LegacySupplementariesList
        headerContent={
          !userIsGov ? (
            <Link href={`${Routes.LegacySupplementary}/new`}>
              <Button>Create a Legacy Supplementary Report</Button>
            </Link>
          ) : undefined
        }
      />
    </Suspense>
  );
};

export default Page;
