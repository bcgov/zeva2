import { Suspense } from "react";
import { fetchUsers } from "@/app/administration/lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { UserTable } from "../lib/components/UserTable";
import { userIsAdmin } from "@/app/administration/lib/utilsServer";

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const args = await props.params;
  const slug = args.slug;
  const isAdmin = await userIsAdmin();
  if (slug === "idir" || slug === "bceid" || slug === "inactive") {
    const users = await fetchUsers(slug);
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <UserTable users={users} category={slug} isAdmin={isAdmin} />
      </Suspense>
    );
  }
  return null;
};

export default Page;
