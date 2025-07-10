import { emailQueueName, icbcQueueName } from "@/lib/constants/queue";
import { handleEmailJob, handleEmailJobCompleted } from "./handlers/email";
import {
  handleConsumeIcbcFileJob,
  handleConsumeIcbcFileJobCompleted,
  handleConsumeIcbcFileJobFailed,
} from "./handlers/icbc";
import { handleCreateDefaultBucket } from "./handlers/runOnce";
import { ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? "redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  username: process.env.REDIS_USERNAME ?? undefined,
  password: process.env.REDIS_PASSWORD ?? undefined,
  tls: process.env.REDIS_TLS_DISABLED === "true" ? undefined : {},
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
    {
      queueName: icbcQueueName,
      numberOfWorkers: 1, // do not change this
      handler: handleConsumeIcbcFileJob,
      completedHandler: handleConsumeIcbcFileJobCompleted,
      failedHandler: handleConsumeIcbcFileJobFailed,
    },
  ],
  queueDefaultJobOptions: {
    attempts: 10,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 5000,
  },
  // any 2 run once job names should be distinct from each other
  runOnceJobDefns: [
    {
      name: "create-minio-bucket",
      handler: handleCreateDefaultBucket,
      data: {},
    },
  ],
};
