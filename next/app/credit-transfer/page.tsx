import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { CreditTransferList } from "./lib/components/CreditTransferList";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <CreditTransferList
        headerContent={
          !userIsGov ? (
            <Link href={`${Routes.CreditTransfers}/new`}>
              <Button variant="primary">Create a Credit Transfer</Button>
            </Link>
          ) : undefined
        }
      />
    </Suspense>
  );
};

export default Page;
