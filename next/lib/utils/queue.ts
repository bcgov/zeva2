import { DefaultJobOptions, Queue, Worker } from "bullmq";
import { bullmqConfig } from "@/bullmq/config";
import { emailQueueName, icbcQueueName } from "@/lib/constants/queue";
import { JobsOptions } from "bullmq";

// re-use queues, and therefore connections; otherwise, there may be too many connections to redis...
const queues: { [key: string]: Queue } = {};

const getQueue = (queueName: string) => {
  if (!queues[queueName]) {
    queues[queueName] = new Queue(queueName, {
      connection: bullmqConfig.queueConnection,
      defaultJobOptions: bullmqConfig.queueDefaultJobOptions,
    });
  }
  return queues[queueName];
};

export const addJobToEmailQueue = async (
  payload: { toEmail: string; msg: string },
  opts?: JobsOptions,
) => {
  const queue = getQueue(emailQueueName);
  await queue.add("anEmailJob", payload, opts);
};

export const addJobToIcbcQueue = async (
  icbcFileId: number,
  opts?: JobsOptions,
) => {
  const queue = getQueue(icbcQueueName);
  await queue.add("processIcbcFileJob", { icbcFileId }, opts);
};
