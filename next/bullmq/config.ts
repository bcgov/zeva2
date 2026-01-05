import { handleEmailJob } from "./handlers/email";
import {
  handleConsumeIcbcFileJob,
  handleConsumeIcbcFileJobCompleted,
  handleConsumeIcbcFileJobFailed,
} from "./handlers/icbc";
import { handleCreateDefaultBucket } from "./handlers/runOnce";
import { ConnectionOptions } from "bullmq";
import { QueueNames } from "@/app/lib/constants/queue";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? "redis",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
  tls:
    process.env.REDIS_TLS_ENABLED === "true"
      ? { rejectUnauthorized: false }
      : undefined,
  // please see the "Reconnect on error" section of https://ioredis.readthedocs.io/en/latest/README/
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.slice(0, targetError.length) === targetError) {
      // Only reconnect when the error starts with "READONLY"
      return true; // or `return 1;`
    }
    return false;
  },
};

export const bullmqConfig = {
  startWorkers: process.env.START_WORKERS === "true",
  connection: connection,
  queueConnection: connection,
  workerSpecs: [
    {
      queueName: QueueNames.Email,
      numberOfWorkers: 1,
      handler: handleEmailJob,
    },
    {
      queueName: QueueNames.Icbc,
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
