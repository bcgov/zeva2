import { Queue } from "bullmq";
import { bullmqConfig } from "@/bullmq/config";
import { emailQueueName } from "@/constants/queue";
import { BaseJobOptions } from "bullmq";

// re-use queues, and therefore connections; otherwise, there may be too many connections to redis...
const queues: { [key: string]: Queue } = {};

const getEmailQueue = () => {
  if (!queues[emailQueueName]) {
    queues[emailQueueName] = new Queue(emailQueueName, {
      connection: bullmqConfig.queueConnection,
      defaultJobOptions: bullmqConfig.queueDefaultJobOptions,
    });
  }
  return queues[emailQueueName];
};

export const addJobToEmailQueue = async (
  payload: { toEmail: string; msg: string },
  opts?: BaseJobOptions,
) => {
  const queue = getEmailQueue();
  const addJobDefaultJobOpts = bullmqConfig.addJobDefaultOptions;
  await queue.add("anEmailJob", payload, { ...addJobDefaultJobOpts, ...opts });
};
