import { emailQueueName } from "@/lib/constants/queue";
import { handleEmailJob, handleEmailJobCompleted } from "./handlers";

const connection = {
  host: process.env.REDIS_HOST ?? "redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
};

export const bullmqConfig = {
  startWorkers: process.env.START_WORKERS === "true",
  connection: connection,
  queueConnection: { ...connection, enableOfflineQueue: false },
  workerSpecs: [
    {
      queueName: emailQueueName,
      numberOfWorkers: 1,
      handler: handleEmailJob,
      completedHandler: handleEmailJobCompleted,
    },
  ],
  queueDefaultJobOptions: {
    attempts: 10,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
  addJobDefaultOptions: {
    removeOnComplete: 100,
    removeOnFail: 5000,
  },
};
