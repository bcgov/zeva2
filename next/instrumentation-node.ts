import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getClient } from "./app/lib/services/s3";
import { getFlagCAsQueue } from "./app/lib/services/queue";

export const createBucket = async () => {
  const client = getClient();
  const bucketName = process.env.S3_BUCKET_NAME;
  if (bucketName) {
    const bucketExistsCommand = new HeadBucketCommand({ Bucket: bucketName });
    let bucketExists = true;
    try {
      await client.send(bucketExistsCommand);
    } catch {
      bucketExists = false;
    }
    if (!bucketExists) {
      const command = new CreateBucketCommand({ Bucket: bucketName });
      await client.send(command);
    }
  }
};

export const upsertJobScheduler = async () => {
  const queue = getFlagCAsQueue();
  // any year works
  const beginningOfCy = new Date(
    `2019-${process.env.BEGINNING_OF_COMPLIANCE_YEAR}`,
  );
  await queue.upsertJobScheduler("flag-in-process-CAs", {
    pattern: `${beginningOfCy.getMinutes()} ${beginningOfCy.getHours()} ${beginningOfCy.getDate()} ${beginningOfCy.getMonth() + 1} *`,
  });
};
