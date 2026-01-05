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
    region: "us-east-1",
  });
};

const getPrefixedObjectName = (objectName: string) => {
  const prefix = process.env.MINIO_PREFIX;
  if (prefix) {
    return `${prefix}/${objectName}`;
  }
  return objectName;
};

export const getObject = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.getObject(bucketName, getPrefixedObjectName(objectName));
};

export const putObject = async (
  objectName: string,
  object: Readable | Buffer,
) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.putObject(
    bucketName,
    getPrefixedObjectName(objectName),
    object,
  );
};

export const getPresignedGetObjectUrl = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  return await client.presignedGetObject(
    bucketName,
    getPrefixedObjectName(objectName),
  );
};

export const getPresignedPutObjectUrl = async (objectName: string) => {
  const externalEndpoint = process.env.MINIO_EXTERNAL_ENDPOINT;
  const internalEndpoint = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT;
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  
  if (externalEndpoint) {
    const [host, extPort] = externalEndpoint.includes(':') 
      ? externalEndpoint.split(':') 
      : [externalEndpoint, port];
      
    const externalClient = new Minio.Client({
      endPoint: host,
      port: extPort ? parseInt(extPort) : parseInt(port ?? "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      region: "us-east-1",
    });
    
    return await externalClient.presignedPutObject(
      bucketName,
      getPrefixedObjectName(objectName),
    );
  }
  
  const client = getClient();
  return await client.presignedPutObject(
    bucketName,
    getPrefixedObjectName(objectName),
  );
};

export const removeObject = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  await client.removeObject(bucketName, getPrefixedObjectName(objectName));
};

export const removeObjects = async (objectNames: string[]) => {
  const client = getClient();
  const bucketName = process.env.MINIO_BUCKET_NAME ?? "";
  const finalObjectNames = objectNames.map((name) => {
    return getPrefixedObjectName(name);
  });
  await client.removeObjects(bucketName, finalObjectNames);
};
