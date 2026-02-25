import { getClient } from "@/app/lib/services/s3";
import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

export const handleCreateDefaultBucket = async () => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
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
