import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export enum Directory {
  Agreement = "agreement",
  Assessment = "assessment",
  CreditApplication = "creditApplication",
  Forecast = "forecast",
  Icbc = "icbc",
  ModelYearReport = "modelYearReport",
  ModelYearReportAttachments = "modelYearReportAttachments",
  Reassessment = "reassessment",
  Supplementary = "supplementary",
  SupplementaryAttachments = "supplementaryAttachments",
  SupplementaryReassessment = "supplementaryReassessment",
  Templates = "templates",
  Vehicle = "vehicle",
}

export const getClient = () => {
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
  });
};

const getPrefixedObjectName = (objectName: string) => {
  const prefix = process.env.S3_PREFIX;
  if (prefix) {
    return `${prefix}/${objectName}`;
  }
  return objectName;
};

export const getObject = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.S3_BUCKET_NAME ?? "";
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: getPrefixedObjectName(objectName),
  });
  return await client.send(command);
};

export const getObjectAsBuffer = async (objectName: string) => {
  const commandOutput = await getObject(objectName);
  const body = commandOutput.Body;
  if (!body) {
    return new ArrayBuffer(0);
  }
  const byteArray = await body.transformToByteArray();
  const buffer = Buffer.from(byteArray).buffer;
  return buffer;
};

export const getPresignedGetObjectUrl = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.S3_BUCKET_NAME ?? "";
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: getPrefixedObjectName(objectName),
  });
  return await getSignedUrl(client, command, {
    expiresIn: 3600,
  });
};

export const getPresignedPutObjectUrl = async (objectName: string) => {
  const client = getClient();
  const bucketName = process.env.S3_BUCKET_NAME ?? "";
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: getPrefixedObjectName(objectName),
    IfNoneMatch: "*",
  });
  return await getSignedUrl(client, command, {
    expiresIn: 3600,
  });
};

export const getTemplateDownloadUrl = async (templateName: string) => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${templateName}`,
  );
};

export const getAttachmentPutData = async (
  directory: Directory,
  numberOfFiles: number,
) => {
  const result: { objectName: string; url: string }[] = [];
  for (let i = 1; i <= numberOfFiles; i++) {
    const objectName = `${directory}/${randomUUID()}`;
    const url = await getPresignedPutObjectUrl(objectName);
    result.push({
      objectName,
      url,
    });
  }
  return result;
};
