import { Suspense } from "react";
import { getPageParams } from "@/app/lib/utils/nextPage";
import { fetchUsers } from "./lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/client";
import UserTable from "./lib/components/UserTable";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const { userIsGov, userRoles } = await getUserInfo();
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { users, totalCount } = await fetchUsers(
    page,
    pageSize,
    filters,
    sorts,
  );

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {(userRoles.includes(Role.ADMINISTRATOR) ||
        userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)) && (
        <Link href={`${Routes.Users}/new`}>
          <Button>Create New User</Button>
        </Link>
      )}
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
