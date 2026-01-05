import Redis from "ioredis";
import { IcbcFileStatus } from "@/prisma/generated/client";

const redisConfig = {
  host: process.env.REDIS_HOST ?? "redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  ...(process.env.REDIS_TLS_ENABLED === "true"
    ? { tls: { rejectUnauthorized: false } }
    : {}),
};

export const ICBC_STATUS_CHANNEL = "icbc:status:updates";

export type IcbcStatusEvent = {
  icbcFileId: number;
  status: IcbcFileStatus;
  timestamp: Date;
};

// Create a publisher instance
let publisherInstance: Redis | null = null;

export const getRedisPublisher = () => {
  if (!publisherInstance) {
    publisherInstance = new Redis(redisConfig);
    
    publisherInstance.on("error", (err) => {
      console.error("Redis publisher error:", err);
    });
    
    publisherInstance.on("connect", () => {
      console.log("Redis publisher connected");
    });
  }
  return publisherInstance;
};

// Publish ICBC status update
export const publishIcbcStatusUpdate = async (event: IcbcStatusEvent) => {
  try {
    const publisher = getRedisPublisher();
    const result = await publisher.publish(ICBC_STATUS_CHANNEL, JSON.stringify(event));
    console.log(`Published ICBC status update for file ${event.icbcFileId}:`, event.status, `(${result} subscribers)`);
  } catch (error) {
    console.error("Error publishing ICBC status update:", error);
    throw error;
  }
};

// Create a subscriber (each SSE connection will create its own)
export const createRedisSubscriber = () => {
  return new Redis(redisConfig);
};
