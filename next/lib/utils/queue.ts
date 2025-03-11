import { Queue } from "bullmq";
import { bullmqConfig } from "@/bullmq/config";
import { emailQueueName } from "@/constants/queue";
import { BaseJobOptions } from "bullmq";

export const getEmailQueue = () => {
  return new Queue(emailQueueName, {
    connection: bullmqConfig.connection,
    defaultJobOptions: bullmqConfig.queueDefaultJobOptions,
  });
};

export const addJobToEmailQueue = async (
  payload: { toEmail: string; msg: string },
  opts: BaseJobOptions,
) => {
  const queue = getEmailQueue();
  const addJobDefaultJobOpts = bullmqConfig.addJobDefaultOptions;
  await queue.add("email", payload, { ...addJobDefaultJobOpts, ...opts });
};
