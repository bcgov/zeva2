import { removeObjects } from "../minio";

export type CaFile = {
  data: string;
  fileName: string;
};

export type Attachment = {
  fileName: string;
  objectName: string;
};

export type AttachmentDownload = {
  fileName: string;
  url: string;
};

export const deleteAttachments = async (
  orgId: number,
  attachments: Attachment[],
  fullObjectNameGetter: (orgId: number, objectName: string) => string,
) => {
  const objectNames = attachments.map((attachment) => {
    return fullObjectNameGetter(orgId, attachment.objectName);
  });
  await removeObjects(objectNames);
};
