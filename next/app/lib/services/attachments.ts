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
  type: "creditApplication" | "vehicle",
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
    return { objectName };
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
  }
  return result;
};
