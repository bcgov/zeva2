import { Suspense } from "react";
import { UserInformationPanel } from "./components/UserInformationPanel";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { ActionCenter } from "./components/ActionCenter";

const Page = async () => {
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
