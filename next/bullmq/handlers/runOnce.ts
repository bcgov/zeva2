import { getClient } from "@/app/lib/minio";

export const handleCreateDefaultBucket = async () => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  if (bucketName) {
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      await client.makeBucket(bucketName);
    }
  }
};
