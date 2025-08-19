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

export default async function Page(props: {
  searchParams?: Promise<pageStringParams>;
}) {
  const { userIsGov } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);
  const { users, totalCount } = await fetchUsers(
    page,
    pageSize,
    filters,
    sorts,
  );

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {isAdmin && (
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
