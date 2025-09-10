import { addJobToEmailQueue, addJobToIcbcQueue } from "../queue";
import { emailQueueName, icbcQueueName } from "@/lib/constants/queue";
import { Queue as MockedQueue } from "bullmq";

describe("queue utils", () => {
  beforeEach(() => {
    // @ts-ignore
    (MockedQueue as any).__add.mockClear?.();
    // @ts-ignore
    (MockedQueue as any).mockClear?.();
    // @ts-ignore
    (MockedQueue as any).__instances.length = 0;
  });

  test("addJobToEmailQueue creates/reuses queue and enqueues job", async () => {
    await addJobToEmailQueue({ toEmail: "a@b.com", msg: "hi" }, { delay: 10 });

    // New Queue should be constructed with emailQueueName
    expect((MockedQueue as any)).toHaveBeenCalledWith(emailQueueName, expect.any(Object));
    // Add should be called with job name and payload
    // @ts-ignore
    const add = (MockedQueue as any).__add as jest.Mock;
    expect(add).toHaveBeenCalledWith(
      "anEmailJob",
      { toEmail: "a@b.com", msg: "hi" },
      { delay: 10 },
    );
  });

  test("addJobToIcbcQueue sets attempts to 1", async () => {
    await addJobToIcbcQueue(123, { attempts: 5, jobId: "abc" } as any);
    expect((MockedQueue as any)).toHaveBeenCalledWith(icbcQueueName, expect.any(Object));
    // @ts-ignore
    const add = (MockedQueue as any).__add as jest.Mock;
    expect(add).toHaveBeenCalledWith(
      "processIcbcFileJob",
      { icbcFileId: 123 },
      expect.objectContaining({ attempts: 1, jobId: "abc" }),
    );
  });
});

