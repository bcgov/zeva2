import { Suspense } from "react";
import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { fetchUsers } from "./lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { getUserInfo } from "@/auth";
import UserTable from "./lib/components/UserTable";
import { redirect } from "next/navigation";
import {
  getFilterStringWithActiveFilter,
  getTransformedFilters,
  userIsAdmin,
} from "./lib/utils";

export default async function Page(props: {
  searchParams?: Promise<pageStringParams>;
}) {
  const { userIsGov } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { filters: transformedFilters, isActive } =
    getTransformedFilters(filters);
  const { users, totalCount } = await fetchUsers(
    page,
    pageSize,
    transformedFilters,
    sorts,
  );

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {isAdmin && (
        <Link href={`${Routes.Users}/new`}>
          <Button variant="primary">Create New User</Button>
        </Link>
      )}
      <div className="mb-4 flex gap-2 border-b">
        <Link
          href={{
            pathname: "/users",
            query: {
              ...searchParams,
              page: "1",
              filters: getFilterStringWithActiveFilter(filters, true),
            },
          }}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            isActive
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Active users
        </Link>
        <Link
          href={{
            pathname: "/users",
            query: {
              ...searchParams,
              page: "1",
              filters: getFilterStringWithActiveFilter(filters, false),
            },
          }}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            !isActive
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Inactive users
        </Link>
      </div>
      <UserTable
        users={users}
        totalCount={totalCount}
        navigationAction={async (id: number) => {
          "use server";
          redirect(`${Routes.Users}/${id}/edit`);
        }}
        userIsGov={userIsGov}
      />
    </Suspense>
  );
}
