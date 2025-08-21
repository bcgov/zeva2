import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { VehicleList } from "./lib/components/VehicleList";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov } = await getUserInfo();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {!userIsGov && (
        <Link href={`${Routes.Vehicle}/new`}>
          <Button>Submit a Vehicle</Button>
        </Link>
      )}
      <VehicleList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
