import { bullmqConfig } from "./config";
import { Worker } from "bullmq";

if (bullmqConfig.startWorkers) {
  for (const workerSpec of bullmqConfig.workerSpecs) {
    const queueName = workerSpec.queueName;
    const numberOfWorkers = workerSpec.numberOfWorkers;
    const handler = workerSpec.handler;
    const completedHandler = workerSpec.completedHandler;
    for (let i = 0; i < numberOfWorkers; i++) {
      const worker = new Worker(queueName, handler, {
        connection: bullmqConfig.connection,
      });
      if (completedHandler) {
        worker.on("completed", completedHandler);
      }
      // can also listen to "progress" and "failed" events
    }
  }
}
