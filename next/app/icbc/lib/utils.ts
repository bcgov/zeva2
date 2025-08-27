import { IcbcFileStatus, Prisma } from "@/prisma/generated/client";
import { IcbcFileSparse } from "./data";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";
import { IcbcFileSubDirectory } from "./constants";

export const getWhereClause = (
  filters: Record<string, string>,
): Prisma.IcbcFileWhereInput => {
  const result: Prisma.IcbcFileWhereInput = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "id") {
      result[key] = parseInt(value, 10);
    } else if (key === "status") {
      const newValue = value.toLowerCase();
      const statuses = Object.values(IcbcFileStatus);
      const matches = statuses.filter((status) => {
        const newStatus = status.toLowerCase();
        return newStatus.includes(newValue);
      });
      result[key] = {
        in: matches,
      };
    } else if (key === "isLegacy") {
      const newValue = value.toLowerCase().trim();
      if (newValue === "yes") {
        result[key] = true;
      } else if (newValue === "no") {
        result[key] = false;
      } else {
        result.id = -1;
      }
    } else if (key === "timestamp") {
      const [isValidDate, date] = validateDate(value);
      if (isValidDate) {
        result[key] = date;
      } else {
        result.id = -1;
      }
    }
  });
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
): Prisma.IcbcFileOrderByWithRelationInput[] => {
  const result: Prisma.IcbcFileOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    if (value === "asc" || value === "desc") {
      if (
        key === "id" ||
        key === "status" ||
        key === "timestamp" ||
        key === "isLegacy"
      ) {
        result.push({ [key]: value });
      }
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export type IcbcFileSparseSerialized = Omit<IcbcFileSparse, "timestamp"> & {
  timestamp: string;
};

export const getSerializedIcbcFiles = (
  files: IcbcFileSparse[],
): IcbcFileSparseSerialized[] => {
  const result: IcbcFileSparseSerialized[] = [];
  files.forEach((file) => {
    result.push({
      ...file,
      timestamp: getIsoYmdString(file.timestamp),
    });
  });
  return result;
};

export const getIcbcFileFullObjectName = (objectName: string) => {
  return `${IcbcFileSubDirectory.IcbcFiles}/${objectName}`;
};
