import { bullmqConfig } from "./config";
import { Worker } from "bullmq";

if (bullmqConfig.startWorkers) {
  const defaultConnection = bullmqConfig.connection;
  for (const workerSpec of bullmqConfig.workerSpecs) {
    const queueName = workerSpec.queueName;
    const numberOfWorkers = workerSpec.numberOfWorkers;
    const handler = workerSpec.handler;
    const completedHandler = workerSpec.completedHandler;
    const failedHandler = workerSpec.failedHandler;
    for (let i = 0; i < numberOfWorkers; i++) {
      const worker = new Worker<any>(queueName, handler, {
        connection: defaultConnection,
      });
      worker.on("ready", () => {
        console.log(
          "At %s, a worker for the %s queue is ready!",
          new Date(),
          queueName,
        );
      });
      worker.on("error", (err) => {
        console.error("At %s, encountered error: %s", new Date(), err);
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
}
