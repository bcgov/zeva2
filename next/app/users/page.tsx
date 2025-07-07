import { Suspense } from "react";
import { getPageParams } from "@/app/lib/utils/nextPage";
import { fetchUsers } from "./lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import UserTable from "./lib/components/UserTableClient";

export default async function Page({ searchParams }) {
  const { page, pageSize, filters, sorts } = getPageParams(
    searchParams,
    1,
    10
  );
  const { users, totalCount } = await fetchUsers({
    page,
    pageSize,
    filters,
    sorts,
  });

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UserTable users={users} totalCount={totalCount} />
    </Suspense>
  );
}
