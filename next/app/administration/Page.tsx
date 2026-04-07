import { getUserInfo } from "@/auth";
import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { IndividualPage } from "../vehicle-suppliers/lib/components/IndividualPage";

const Page = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <IndividualPage orgId={userOrgId.toString()} />
      </Suspense>
    </div>
  );
};

export default Page;
