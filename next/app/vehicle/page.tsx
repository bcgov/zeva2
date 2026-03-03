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
      <div className="mb-4 flex gap-2 border-b border-gray-400">
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
          className={`px-4 py-2.5 text-sm -mb-px rounded-t ${
            isActive
              ? "border-t border-l border-r border-gray-400 border-b-white bg-white text-black"
              : "border-t border-l border-r border-gray-300 border-b-gray-400 text-blue-700 hover:bg-gray-100"
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
          className={`px-4 py-2.5 text-sm -mb-px rounded-t ${
            !isActive
              ? "border-t border-l border-r border-gray-400 border-b-white bg-white text-black"
              : "border-t border-l border-r border-gray-300 border-b-gray-400 text-blue-700 hover:bg-gray-100"
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
