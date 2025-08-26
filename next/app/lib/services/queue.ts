import { bullmqConfig } from "@/bullmq/config";
import { EmailJobData } from "@/bullmq/handlers/email";
import { JobsOptions, Queue } from "bullmq";

export enum QueueNames {
  Email = "email",
  Icbc = "icbc",
}

const queues: {
  [QueueNames.Email]: Readonly<Queue<EmailJobData>> | null;
  [QueueNames.Icbc]: Readonly<Queue<number>> | null;
} = {
  [QueueNames.Email]: null,
  [QueueNames.Icbc]: null,
};

const getEmailQueue = () => {
  if (!queues[QueueNames.Email]) {
    queues[QueueNames.Email] = new Queue<EmailJobData>(QueueNames.Email, {
      connection: bullmqConfig.queueConnection,
      defaultJobOptions: bullmqConfig.queueDefaultJobOptions,
    });
  }
  return queues[QueueNames.Email];
};

const getIcbcQueue = () => {
  if (!queues[QueueNames.Icbc]) {
    queues[QueueNames.Icbc] = new Queue<number>(QueueNames.Icbc, {
      connection: bullmqConfig.queueConnection,
      defaultJobOptions: {
        ...bullmqConfig.queueDefaultJobOptions,
        attempts: 1,
      },
    });
  }
  return queues[QueueNames.Icbc];
};

export const addJobToEmailQueue = async (
  data: EmailJobData,
  opts?: JobsOptions,
) => {
  const queue = getEmailQueue();
  await queue.add("anEmailJob", data, opts);
};

export const addJobToIcbcQueue = async (
  icbcFileId: number,
  opts?: JobsOptions,
) => {
  const queue = getIcbcQueue();
  await queue.add("processIcbcFileJob", icbcFileId, opts);
};
