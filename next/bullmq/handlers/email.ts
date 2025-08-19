import { Job } from "bullmq";

export const handleEmailJob = async (job: Job) => {
  // todo
};

export const handleEmailJobCompleted = (job: Job, returnValue: any) => {
  // this handler is probably unnecessary; here just to illustrate a pattern
};
