"use client";

import { useState } from "react";
import { ContentCard } from "../lib/components";

export default function Dashboard() {
  // TODO: Get latest activity from API
  const [loading, _] = useState(true);

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
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        ) : (
          <p>Latest activity goes here</p>
        )}
      </ContentCard>
    </div>
  );
}
