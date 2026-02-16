import {
  getModelYearEnumsToStringsMap,
  getStringsToModelYearsEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, PenaltyCreditStatus } from "@/prisma/generated/enums";
import {
  PenaltyCreditWhereInput,
  PenaltyCreditOrderByWithRelationInput,
} from "@/prisma/generated/models";

export const parseComplianceYear = (
  complianceYear: ModelYear,
): [string, number] => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const complianceYearString = modelYearsMap[complianceYear];
  if (!complianceYearString) {
    throw new Error("Invalid Compliance Year!");
  }
  const complianceYearInt = parseInt(complianceYearString, 10);
  if (Number.isNaN(complianceYearInt)) {
    throw new Error("Unparseable Compliance Year!");
  }
  return [complianceYearString, complianceYearInt];
};

export const getPenaltyCreditTransactionDate = (complianceYear: ModelYear) => {
  const [_complianceYearString, complianceYearInt] =
    parseComplianceYear(complianceYear);
  const nextYear = (complianceYearInt + 1).toString();
  return new Date(`${nextYear}-10-01T00:00:00`);
};

export const getWhereClause = (
  filters: Record<string, string>,
): PenaltyCreditWhereInput => {
  const result: PenaltyCreditWhereInput = {};
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "id") {
      result[key] = parseInt(value, 10);
    } else if (key === "status") {
      const newValue = value.replaceAll(" ", "").toLowerCase();
      const statuses = Object.values(PenaltyCreditStatus);
      const matches = statuses.filter((status) => {
        const newStatus = status.replaceAll("_", "").toLowerCase();
        return newStatus.includes(newValue);
      });
      result[key] = {
        in: matches,
      };
    } else if (key === "organization") {
      const newValue = value.trim();
      result[key] = {
        is: {
          name: {
            contains: newValue,
            mode: "insensitive",
          },
        },
      };
    } else if (key === "complianceYear") {
      const modelYearEnums: ModelYear[] = [];
      const modelYearStrings = Object.keys(modelYearsMap);
      modelYearStrings.forEach((my) => {
        if (my.includes(value) && modelYearsMap[my]) {
          modelYearEnums.push(modelYearsMap[my]);
        }
      });
      result[key] = {
        in: modelYearEnums,
      };
    }
  });
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
): PenaltyCreditOrderByWithRelationInput[] => {
  const result: PenaltyCreditOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    if (value === "asc" || value === "desc") {
      if (key === "id" || key === "status" || key === "complianceYear") {
        result.push({ [key]: value });
      } else if (key === "organization") {
        result.push({
          [key]: {
            name: value,
          },
        });
      }
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};
