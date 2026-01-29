import {
  getMatchingTerms,
  getStringsToCreditTransferStatusEnumsMap,
  getStringsToCreditTransferSupplierStatusEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { Prisma } from "@/prisma/generated/client";
import { CreditTransferSparse } from "./data";

export const getWhereClause = (
  filters: Record<string, string>,
  userIsGov: boolean,
): Prisma.CreditTransferWhereInput => {
  const result: Prisma.CreditTransferWhereInput = {};
  const statusMap = getStringsToCreditTransferStatusEnumsMap();
  const supplierStatusMap = getStringsToCreditTransferSupplierStatusEnumsMap();
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue.trim();
    if (key === "id") {
      result[key] = parseInt(value, 10);
    } else if (key === "status") {
      if (userIsGov) {
        result[key] = {
          in: getMatchingTerms(statusMap, value),
        };
      } else {
        result["supplierStatus"] = {
          in: getMatchingTerms(supplierStatusMap, value),
        };
      }
    } else if (key === "transferFrom" || key === "transferTo") {
      result[key] = {
        is: { name: { contains: value, mode: "insensitive" } },
      };
    }
  }
  return result;
};

export const getOrderByClause = (
  sorts: { [key: string]: string },
  defaultSortById: boolean,
  userIsGov: boolean,
): Prisma.CreditTransferOrderByWithRelationInput[] => {
  const result: Prisma.CreditTransferOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    const orderBy: Prisma.CreditTransferOrderByWithRelationInput = {};
    if (value === "asc" || value === "desc") {
      if (key === "id") {
        orderBy[key] = value;
      } else if (key === "transferTo" || key === "transferFrom") {
        orderBy[key] = {
          name: value,
        };
      } else if (key === "status") {
        if (userIsGov) {
          orderBy[key] = value;
        } else {
          orderBy["supplierStatus"] = value;
        }
      }
    }
    if (Object.keys(orderBy).length > 0) {
      result.push(orderBy);
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export type CreditTransferSparseSerialized = Omit<
  CreditTransferSparse,
  "supplierStatus"
>;

export const getSerializedTransfers = (
  transfers: CreditTransferSparse[],
  userIsGov: boolean,
): CreditTransferSparseSerialized[] => {
  return transfers.map((transfer) => {
    const { supplierStatus, ...result } = transfer;
    if (!userIsGov) {
      result.status = transfer.supplierStatus;
    }
    return result;
  });
};
