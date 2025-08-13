import {
  AgreementType,
  AgreementStatus,
  Prisma,
} from "@/prisma/generated/client";

export const getWhereClause = (
  filters: Record<string, string>,
): Prisma.AgreementWhereInput => {
  const result: Prisma.AgreementWhereInput = {
    status: { not: AgreementStatus.DELETED },
  };
  let filteredTypes = Object.values(AgreementType);
  Object.entries(filters).forEach(([key, value]) => {
    const val = value.trim().toUpperCase();
    switch (key) {
      case "agreementId": {
        if (!val) break;
        let id = parseInt(val, 10);
        if (!isNaN(id)) {
          result.id = id;
        } else {
          const [prefix, idString, extra] = val.split("-");
          if (extra !== undefined) {
            result.id = 0; // if the id is not in the correct format, filter out all agreements.
            break;
          }
          if (prefix === "I" || prefix === "IA") {
            filteredTypes = filteredTypes.filter(
              (t) => t === AgreementType.INITIATIVE,
            );
          } else if (prefix === "P" || prefix === "PA") {
            filteredTypes = filteredTypes.filter(
              (t) => t === AgreementType.PURCHASE,
            );
          } else if (prefix !== "A") {
            filteredTypes = [];
          }
          result.agreementType = { in: filteredTypes };
          if (idString) {
            id = parseInt(idString, 10);
            result.id = isNaN(id) ? 0 : id; // if the id is not a number, filter out all agreements.
          }
        }
        break;
      }
      case "referenceId": {
        result.referenceId = val
          ? { contains: val, mode: "insensitive" }
          : undefined;
        break;
      }
      case "effectiveDate": {
        const [year, month, day] = val.split("-");
        const yearVal = parseInt(year, 10);
        const monthVal = parseInt(month, 10);
        const dayVal = parseInt(day, 10);
        if (isNaN(yearVal) || yearVal < 1900) {
          result.effectiveDate = null;
          break;
        }
        if (isNaN(monthVal) || monthVal < 1 || monthVal > 12) {
          result.effectiveDate = {
            gte: new Date(yearVal, 0, 1),
            lt: new Date(yearVal + 1, 0, 1),
          };
          break;
        }
        if (isNaN(dayVal) || dayVal < 1 || dayVal > 31) {
          result.effectiveDate = {
            gte: new Date(yearVal, monthVal - 1, 1),
            lt: new Date(yearVal, monthVal, 1),
          };
          break;
        }
        result.effectiveDate = {
          gte: new Date(yearVal, monthVal - 1, dayVal),
          lt: new Date(yearVal, monthVal - 1, dayVal + 1),
        };
        break;
      }
      case "agreementType": {
        const typeVal = val.replaceAll(" ", "_");
        filteredTypes = filteredTypes.filter((t) => t.includes(typeVal));
        result.agreementType = { in: filteredTypes };
        break;
      }
      case "status": {
        const statusVal = val.replaceAll(" ", "_");
        result.status = {
          in: Object.values(AgreementStatus).filter((s) =>
            s.includes(statusVal),
          ),
          not: AgreementStatus.DELETED,
        };
        break;
      }
      case "supplier":
        result.organization = {
          is: {
            shortName: {
              contains: val,
              mode: "insensitive",
            },
          },
        };
        break;
    }
  });
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
): Prisma.AgreementOrderByWithRelationInput[] => {
  const result: Prisma.AgreementOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    if (value === "asc" || value === "desc") {
      switch (key) {
        case "agreementId":
          result.push({ id: value });
          break;
        case "supplier":
          result.push({ organization: { shortName: value } });
          break;
        default:
          result.push({ [key]: value });
          break;
      }
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export const getAgreementId = (agreement: {
  id: number;
  agreementType: AgreementType;
}) => {
  return agreement.agreementType[0] + "A-" + agreement.id;
};
