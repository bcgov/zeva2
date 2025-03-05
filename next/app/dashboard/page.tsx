import { ContentCard } from "../lib/components";
import { Suspense } from "react";
import { LatestActivitySkeleton } from "./components/skeletons";
import { LatestActivity } from "./components/latestActivity";

export default function Dashboard() {
  return (
    <div className="flex flex-row w-full">
      <div className="flex flex-col w-1/3">
        <ContentCard title="Welcome">
          <p>Welcome to the dashboard!</p>
        </ContentCard>
        <ContentCard title="We want to hear from you">
          <p>What do you think of the dashboard?</p>
        </ContentCard>
      </div>
      <ContentCard title="Latest activity" className="w-2/3 ml-2">
        <Suspense fallback={<LatestActivitySkeleton />}>
          <LatestActivity />
        </Suspense>
      </ContentCard>
    </div>
  );
}
