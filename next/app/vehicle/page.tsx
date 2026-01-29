import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { VehicleList } from "./lib/components/VehicleList";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import {
  getFilterStringWithActiveFilter,
  getTransformedFilters,
} from "../lib/utils/filter";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov } = await getUserInfo();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { filters: transformedFilters, isActive } = getTransformedFilters(
    "user",
    filters,
  );

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {!userIsGov && (
        <Link href={`${Routes.Vehicle}/new`}>
          <Button variant="primary">Create a Vehicle</Button>
        </Link>
      )}
      <div className="mb-4 flex gap-2 border-b">
        <Link
          href={{
            pathname: Routes.Vehicle,
            query: {
              ...searchParams,
              page: "1",
              filters: getFilterStringWithActiveFilter(
                "vehicle",
                filters,
                true,
              ),
            },
          }}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            isActive
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Active Vehicles
        </Link>
        <Link
          href={{
            pathname: Routes.Vehicle,
            query: {
              ...searchParams,
              page: "1",
              filters: getFilterStringWithActiveFilter(
                "vehicle",
                filters,
                false,
              ),
            },
          }}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            !isActive
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Inactive Vehicles
        </Link>
      </div>
      <VehicleList
        page={page}
        pageSize={pageSize}
        filters={transformedFilters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
