import { IcbcFileModel } from "@/prisma/generated/models";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { IcbcFileWithUserName } from "./data";

export type IcbcFileSerialized = Omit<
  IcbcFileModel,
  "name" | "uploadedById" | "timestamp" | "createTimestamp"
> & {
  timestamp: string;
  createTimestamp: string;
  uploadedBy: string | null;
};

export const getSerializedIcbcFiles = (
  files: IcbcFileWithUserName[],
): IcbcFileSerialized[] => {
  const result: IcbcFileSerialized[] = [];
  for (const file of files) {
    result.push({
      ...file,
      timestamp: getIsoYmdString(file.timestamp),
      createTimestamp: getIsoYmdString(file.createTimestamp),
      uploadedBy: file.uploadedBy
        ? `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}`
        : null,
    });
  }
  return result;
};
