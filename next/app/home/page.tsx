import { Suspense } from "react";
import { UserInformationPanel } from "./components/UserInformationPanel";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { ActionCenter } from "./components/ActionCenter";
import { getUserInfo } from "@/auth";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return (
      <div className="w-full">
        <Suspense fallback={<LoadingSkeleton />}>
          <ActionCenter />
        </Suspense>
      </div>
    );
  }
  return (
    <div className="flex flex-row gap-4 w-full">
      <div className="w-1/5">
        <Suspense fallback={<LoadingSkeleton />}>
          <UserInformationPanel />
        </Suspense>
      </div>
      <div className="w-4/5">
        <Suspense fallback={<LoadingSkeleton />}>
          <ActionCenter />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;
