// keep on eye on this issue: https://github.com/minio/minio-js/issues/1371
import * as Minio from "minio";
import { Readable } from "stream";

export const getClient = () => {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "",
    port: parseInt(process.env.MINIO_PORT ?? ""),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
};

export const getObject = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.getObject(bucketName, objectName);
};

export const putObject = async (
  objectName: string,
  object: Readable | Buffer,
) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.putObject(bucketName, objectName, object);
};

export const getPresignedGetObjectUrl = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.presignedGetObject(bucketName, objectName);
};

export const getPresignedPutObjectUrl = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.presignedPutObject(bucketName, objectName);
};

export const removeObject = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  await client.removeObject(bucketName, objectName);
};

export const setObjectLegalHold = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  // minio's setObjectLegalHold is mis-typed; it does return a Promise
  await (client.setObjectLegalHold(
    bucketName,
    objectName,
  ) as unknown as Promise<void>);
};
