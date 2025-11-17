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
import { userIsAdmin } from "./lib/utils";

function normalizeStatus(sp?: Record<string, string | string[] | undefined>) {
  const raw = (sp?.status ?? "active");
  const status = Array.isArray(raw) ? raw[0] : raw;
  return status === "inactive" ? "inactive" : "active";
}

function withIsActiveFilter<TFilters>(
  filters: TFilters,
  isActive: boolean
): TFilters {
  if (Array.isArray(filters)) {
    const arr = filters as Array<{ id: string; value: unknown }>;
    const without = arr.filter((f) => f.id !== "isActive");
    return [...without, { id: "isActive", value: isActive }] as unknown as TFilters;
  }
  if (filters && typeof filters === "object") {
    return { ...(filters as Record<string, unknown>), isActive } as TFilters;
  }
  return [{ id: "isActive", value: isActive }] as unknown as TFilters;
}

function toSearchString(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  });
  return `?${usp.toString()}`;
}

export default async function Page(props: {
  searchParams?: Promise<pageStringParams>;
}) {
  const { userIsGov } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const status = normalizeStatus(searchParams);
  const isActive = status === "active";
  const filtersWithStatus = withIsActiveFilter(filters, isActive ? "active" : "inactive");
  const { users, totalCount } = await fetchUsers(
    page,
    pageSize,
    filtersWithStatus,
    sorts,
  );

  const baseParams = {
    page: 1,
    pageSize,
  };

  const activeHref = toSearchString({ ...baseParams, status: "active" });
  const inactiveHref = toSearchString({ ...baseParams, status: "inactive" });

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {isAdmin && (
        <Link href={`${Routes.Users}/new`}>
          <Button>Create New User</Button>
        </Link>
      )}
      <div className="mb-4 flex gap-2 border-b">
        <Link
          href={activeHref}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            isActive
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Active users
        </Link>
        <Link
          href={inactiveHref}
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
          redirect(`${Routes.Users}/${id}`);
        }}
        userIsGov={userIsGov}
      />
    </Suspense>
  );
}
