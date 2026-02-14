import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getPresignedPutObjectUrl } from "../minio";

export type Attachment = {
  fileName: string;
  objectName: string;
};

export type AttachmentDownload = {
  fileName: string;
  url: string;
};

export enum Directory {
  CreditApplication = "creditApplication",
  Vehicle = "vehicle",
  Agreement = "agreement",
  ModelYearReport = "modelYearReport",
  Forecast = "forecast",
  Assessment = "assessment",
  Reassessment = "reassessment",
}

export const getPutObjectData = async (
  numberOfFiles: number,
  type: "creditApplication" | "vehicle" | "agreement",
  orgId: number,
) => {
  const result: { objectName: string; url: string }[] = [];
  let directory: string;
  switch (type) {
    case "creditApplication":
      directory = Directory.CreditApplication;
      break;
    case "vehicle":
      directory = Directory.Vehicle;
      break;
    case "agreement":
      directory = Directory.Agreement;
      break;
  }
  for (let i = 0; i < numberOfFiles; i++) {
    const objectName = `${directory}/${randomUUID()}`;
    const url = await getPresignedPutObjectUrl(objectName);
    result.push({
      objectName,
      url,
    });
  }
  const toCreate = result.map(({ objectName }) => {
    return { objectName, organizationId: orgId };
  });
  // will throw if uniqueness constraint violated
  switch (type) {
    case "creditApplication":
      await prisma.creditApplicationAttachment.createMany({
        data: toCreate,
      });
      break;
    case "vehicle":
      await prisma.vehicleAttachment.createMany({
        data: toCreate,
      });
      break;
    case "agreement":
      await prisma.agreementAttachment.createMany({
        data: toCreate,
      });
      break;
  }
  return result;
};

export const checkAttachments = async (
  attachments: Attachment[],
  type: "creditApplication" | "vehicle" | "agreement",
  orgId: number,
) => {
  if (attachments.length === 0) {
    return;
  }
  const objectNames = attachments.map((attachment) => attachment.objectName);
  let attachmentsFound;
  switch (type) {
    case "creditApplication":
      attachmentsFound = await prisma.creditApplicationAttachment.findMany({
        where: {
          objectName: {
            in: objectNames,
          },
          organizationId: orgId,
        },
      });
      break;
    case "vehicle":
      attachmentsFound = await prisma.vehicleAttachment.findMany({
        where: {
          objectName: {
            in: objectNames,
          },
          organizationId: orgId,
        },
      });
      break;
    case "agreement":
      attachmentsFound = await prisma.agreementAttachment.findMany({
        where: {
          objectName: {
            in: objectNames,
          },
          organizationId: orgId,
        },
      });
  }
  if (attachments.length !== attachmentsFound.length) {
    throw new Error("Invalid Attachments!");
  }
};
