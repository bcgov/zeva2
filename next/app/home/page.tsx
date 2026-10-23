import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { SupplierDashboard } from "./components/SupplierDashboard";
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
        <SupplierDashboard />
      </Suspense>
    </div>
  );
};

export default Page;
