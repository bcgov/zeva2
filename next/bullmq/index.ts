import { getNotificationStatusTogglerQueue } from "@/app/lib/services/queue";
import { bullmqConfig } from "./config";
import { Worker } from "bullmq";
import { startHealthServer } from "./health";

let schedulerReady = false;
let workerCount = 0;
const readyWorkers = new Set<Worker>();

startHealthServer(() => schedulerReady && readyWorkers.size === workerCount);

if (bullmqConfig.startWorkers) {
  const defaultConnection = bullmqConfig.connection;
  for (const workerSpec of bullmqConfig.workerSpecs) {
    const queueName = workerSpec.queueName;
    const numberOfWorkers = workerSpec.numberOfWorkers;
    const handler = workerSpec.handler;
    for (let i = 0; i < numberOfWorkers; i++) {
      const worker = new Worker<any>(queueName, handler, {
        connection: defaultConnection,
      });
      workerCount++;
      worker.on("ready", () => {
        readyWorkers.add(worker);
        console.log(
          "At %s, a worker for the %s queue is ready!",
          new Date().toString(),
          queueName,
        );
      });
      worker.on("error", (err) => {
        readyWorkers.delete(worker);
        console.error(
          "At %s, encountered error: %s",
          new Date().toString(),
          err,
        );
      });
      // can listen to the "completed", "failed", "progress" events,
      // and define handlers for those
    }
  }
}

const notificationStatusTogglerQueue = getNotificationStatusTogglerQueue();
notificationStatusTogglerQueue
  .waitUntilReady()
  .then(() =>
    notificationStatusTogglerQueue.upsertJobScheduler(
      "notification-status-toggler",
      { pattern: "0 0 * * *" },
    ),
  )
  .then(() => {
    schedulerReady = true;
    console.log(
      "At %s, a job scheduler for toggling notification statuses was upserted!",
      new Date().toString(),
    );
  })
  .catch((error: unknown) => {
    console.error(
      "Failed to initialize the notification status toggler scheduler:",
      error,
    );
    process.exit(1);
  });
