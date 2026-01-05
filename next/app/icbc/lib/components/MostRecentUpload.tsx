"use client";

import { useEffect, useState, useRef } from "react";
import { getMostRecentSuccessfulUpload } from "../actions";
import { IcbcFileStatus } from "@/prisma/generated/client";

export const MostRecentUpload = () => {
  const [mostRecentDate, setMostRecentDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const fetchMostRecentUpload = async () => {
      const response = await getMostRecentSuccessfulUpload();
      if (response.responseType === "data") {
        setMostRecentDate(response.data.timestamp);
      }
      setLoading(false);
    };

    fetchMostRecentUpload();

    // Connect to SSE to get real-time updates
    const eventSource = new EventSource("/api/icbc/events");
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "connected") {
          return;
        }
        
        // When a file is successfully processed, update the most recent date
        if (data.status === IcbcFileStatus.SUCCESS) {
          fetchMostRecentUpload();
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  if (loading) {
    return <div className="mb-4 text-gray-600">Loading...</div>;
  }

  if (!mostRecentDate) {
    return (
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-700">
          <span className="font-semibold">Most Recent Successful Upload:</span> No uploads yet
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-gray-700">
        <span className="font-semibold">Most Recent Successful Upload:</span>{" "}
        {new Date(mostRecentDate).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
};
