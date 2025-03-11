import { emailQueueName } from "@/constants/queue";
import { handleEmailJob, handleEmailJobCompleted } from "./handlers";

export const bullmqConfig = {
  startWorkers: process.env.START_WORKERS === "true",
  connection: {
    host: process.env.REDIS_HOST ?? "redis",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
  },
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
