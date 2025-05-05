import { bullmqConfig } from "./config";
import { Queue, Worker } from "bullmq";

if (bullmqConfig.startWorkers) {
  const defaultConnection = bullmqConfig.connection;
  for (const workerSpec of bullmqConfig.workerSpecs) {
    const queueName = workerSpec.queueName;
    const numberOfWorkers = workerSpec.numberOfWorkers;
    const handler = workerSpec.handler;
    const completedHandler = workerSpec.completedHandler;
    const failedHandler = workerSpec.failedHandler;
    for (let i = 0; i < numberOfWorkers; i++) {
      const worker = new Worker(queueName, handler, {
        connection: defaultConnection,
      });
      worker.on("error", (err) => {
        console.error(err);
      });
      if (completedHandler) {
        worker.on("completed", completedHandler);
      }
      if (failedHandler) {
        worker.on("failed", failedHandler);
      }
      // can also listen to the "progress" event
    }
  }
  // for run once jobs:
  for (const defn of bullmqConfig.runOnceJobDefns) {
    const jobName = defn.name;
    const queueName = "run-once-job-" + jobName;
    const queue = new Queue(queueName, {
      connection: defaultConnection,
      defaultJobOptions: bullmqConfig.queueDefaultJobOptions,
    });
    const worker = new Worker(queueName, defn.handler, {
      connection: defaultConnection,
    });
    const close = async () => {
      await queue.close();
      await worker.close();
    };
    worker.on("ready", async () => {
      const completedCount = await queue.getCompletedCount();
      if (completedCount >= 1) {
        await close();
      } else {
        await queue.add(jobName, defn.data);
      }
    });
    worker.on("completed", async () => {
      await close();
    });
  }
}
