import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { ActionCenter } from "./components/ActionCenter";
import { getUserInfo } from "@/auth";
import { GovDashboard } from "./components/GovDashboard";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return (
      <div className="w-full">
        <Suspense fallback={<LoadingSkeleton />}>
          <GovDashboard />
        </Suspense>
      </div>
    );
  }
  return (
    <div className="w-full">
      <Suspense fallback={<LoadingSkeleton />}>
        <ActionCenter />
      </Suspense>
    </div>
  );
};

export default Page;
