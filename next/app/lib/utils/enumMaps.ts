// currently, a prisma object {key -> value} generated from a schema enum is
// such that key = value, regardless of the usage of the @map attribute;
// please see: https://github.com/prisma/prisma/issues/8446.
// to overcome this issue, we can use the maps below; not great from a maintenance perspective,
// so hopefully prisma addresses this soon!

import {
  BalanceType,
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
  CreditTransferStatus,
  CreditTransferSupplierStatus,
  Idp,
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  PenaltyCreditStatus,
  ReferenceType,
  Role,
  TransactionType,
  VehicleClass,
  VehicleStatus,
  ZevClass,
} from "@/prisma/generated/client";

export const getMatchingTerms = <Term>(
  map: Partial<Record<string, Term>>,
  searchTerm: string,
): Term[] => {
  const result: Term[] = [];
  Object.entries(map).forEach(([s, t]) => {
    if (t) {
      const term = searchTerm.toLowerCase().replaceAll(" ", "");
      const candidate = s.toLowerCase().replaceAll(" ", "");
      if (candidate.includes(term)) {
        result.push(t);
      }
    }
  });
  return result;
};

export const lowerCaseAndCapitalize = (s: string) => {
  const firstLetter = s.charAt(0);
  const lowerCasedTail = s.toLowerCase().slice(1);
  return firstLetter + lowerCasedTail;
};

export const statusTransformer = (s: string) => {
  const splitString = s.split("_");
  const transformed = splitString.map((t) => {
    return lowerCaseAndCapitalize(t);
  });
  return transformed.join(" ");
};

export const modelYearsTransformer = (s: string) => {
  return s.split("_")[1];
};

export const idpTransformer = (s: string) => {
  return s.toLowerCase().replaceAll("_", "");
};

export const roleTransformer = (s: string) => {
  if (s === Role.ENGINEER_ANALYST) {
    return "Engineer/Analyst";
  } else if (s === Role.ZEVA_USER) {
    return "ZEVA User";
  }
  return statusTransformer(s);
};

export const getStringsToEnumsMap = <E extends string>(
  enumInQuestion: Record<string, E>,
  transformer: (s: string) => string,
) => {
  const result: Partial<Record<string, E>> = {};
  for (const value of Object.values(enumInQuestion)) {
    result[transformer(value)] = value;
  }
  return result;
};

export const getEnumsToStringsMap = <E extends string>(
  enumInQuestion: Record<string, E>,
  transformer: (s: string) => string,
) => {
  const result: Partial<Record<E, string>> = {};
  for (const value of Object.values(enumInQuestion)) {
    result[value] = transformer(value);
  }
  return result;
};

export const getModelYearEnumsToStringsMap = () => {
  return getEnumsToStringsMap<ModelYear>(ModelYear, modelYearsTransformer);
};

export const getStringsToModelYearsEnumsMap = () => {
  return getStringsToEnumsMap<ModelYear>(ModelYear, modelYearsTransformer);
};

export const getZevClassEnumsToStringsMap = () => {
  return getEnumsToStringsMap<ZevClass>(ZevClass, lowerCaseAndCapitalize);
};

export const getStringsToZevClassEnumsMap = () => {
  return getStringsToEnumsMap<ZevClass>(ZevClass, lowerCaseAndCapitalize);
};

export const getVehicleClassEnumsToStringsMap = () => {
  return getEnumsToStringsMap<VehicleClass>(
    VehicleClass,
    lowerCaseAndCapitalize,
  );
};

export const getStringsToVehicleClassEnumsMap = () => {
  return getStringsToEnumsMap<VehicleClass>(
    VehicleClass,
    lowerCaseAndCapitalize,
  );
};

export const getPenaltyCreditStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<PenaltyCreditStatus>(
    PenaltyCreditStatus,
    statusTransformer,
  );
};

export const getStringsToPenaltyCreditStatusEnumsMap = () => {
  return getStringsToEnumsMap<PenaltyCreditStatus>(
    PenaltyCreditStatus,
    statusTransformer,
  );
};

export const getIdpEnumsToStringsMap = () => {
  return getEnumsToStringsMap<Idp>(Idp, idpTransformer);
};

export const getStringsToIdpEnumsMap = () => {
  return getStringsToEnumsMap<Idp>(Idp, idpTransformer);
};

export const getRoleEnumsToStringsMap = () => {
  return getEnumsToStringsMap<Role>(Role, roleTransformer);
};

export const getStringsToRoleEnumsMap = () => {
  return getStringsToEnumsMap<Role>(Role, roleTransformer);
};

export const getReferenceTypeEnumsToStringsMap = () => {
  return getEnumsToStringsMap<ReferenceType>(ReferenceType, statusTransformer);
};

export const getStringsToReferenceTypeEnumsMap = () => {
  return getStringsToEnumsMap<ReferenceType>(ReferenceType, statusTransformer);
};

export const getTransactionTypeEnumsToStringMap = () => {
  return getEnumsToStringsMap<TransactionType>(
    TransactionType,
    statusTransformer,
  );
};

export const getStringsToTransactionTypeEnumsMap = () => {
  return getStringsToEnumsMap<TransactionType>(
    TransactionType,
    statusTransformer,
  );
};

export const getVehicleStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<VehicleStatus>(VehicleStatus, statusTransformer);
};

export const getStringsToVehicleStatusEnumsMap = () => {
  return getStringsToEnumsMap<VehicleStatus>(VehicleStatus, statusTransformer);
};

export const getMyrStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<ModelYearReportStatus>(
    ModelYearReportStatus,
    statusTransformer,
  );
};

export const getStringsToMyrStatusEnumsMap = () => {
  return getStringsToEnumsMap<ModelYearReportStatus>(
    ModelYearReportStatus,
    statusTransformer,
  );
};

export const getMyrSupplierStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<ModelYearReportSupplierStatus>(
    ModelYearReportSupplierStatus,
    statusTransformer,
  );
};

export const getStringsToMyrSupplierStatusEnumsMap = () => {
  return getStringsToEnumsMap<ModelYearReportSupplierStatus>(
    ModelYearReportSupplierStatus,
    statusTransformer,
  );
};

export const getBalanceTypeEnumsToStringsMap = () => {
  return getEnumsToStringsMap<BalanceType>(BalanceType, statusTransformer);
};

export const getStringsToBalanceTypeEnumsMap = () => {
  return getStringsToEnumsMap<BalanceType>(BalanceType, statusTransformer);
};

export const getCreditTransferStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<CreditTransferStatus>(
    CreditTransferStatus,
    statusTransformer,
  );
};

export const getStringsToCreditTransferStatusEnumsMap = () => {
  return getStringsToEnumsMap<CreditTransferStatus>(
    CreditTransferStatus,
    statusTransformer,
  );
};

export const getCreditTransferSupplierStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<CreditTransferSupplierStatus>(
    CreditTransferSupplierStatus,
    statusTransformer,
  );
};

export const getStringsToCreditTransferSupplierStatusEnumsMap = () => {
  return getStringsToEnumsMap<CreditTransferSupplierStatus>(
    CreditTransferSupplierStatus,
    statusTransformer,
  );
};

export const getCreditApplicationStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<CreditApplicationStatus>(
    CreditApplicationStatus,
    statusTransformer,
  );
};

export const getStringsToCreditApplicationStatusEnumsMap = () => {
  return getStringsToEnumsMap<CreditApplicationStatus>(
    CreditApplicationStatus,
    statusTransformer,
  );
};

export const getCreditApplicationSupplierStatusEnumsToStringsMap = () => {
  return getEnumsToStringsMap<CreditApplicationSupplierStatus>(
    CreditApplicationSupplierStatus,
    statusTransformer,
  );
};

export const getStringsToCreditApplicationSupplierStatusEnumsMap = () => {
  return getStringsToEnumsMap<CreditApplicationSupplierStatus>(
    CreditApplicationSupplierStatus,
    statusTransformer,
  );
};
