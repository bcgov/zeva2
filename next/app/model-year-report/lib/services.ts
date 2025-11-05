import { SupplierClass } from "@/app/lib/constants/complianceRatio";
import {
  getCompliancePeriod,
  getDominatedComplianceYears,
} from "@/app/lib/utils/complianceYear";
import { prisma } from "@/lib/prisma";
import {
  calculateBalance,
  flattenZevUnitRecords,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import {
  AddressType,
  ModelYear,
  ModelYearReportStatus,
  OrganizationAddress,
  Prisma,
  ReassessmentStatus,
  ReferenceType,
  SupplyVolume,
  VehicleClass,
  ZevClass,
  ZevUnitTransaction,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import {
  validatePrevBalanceTransactions,
  getZevUnitRecordsOrderByClause,
  getComplianceRatioReductions,
  getTransformedAdjustments,
} from "./utilsServer";
import { TransactionClient } from "@/types/prisma";
import { AdjustmentPayload, NvValues } from "./actions";

export type OrgNameAndAddresses = {
  name: string;
  makes: string[];
  recordsAddress: Omit<OrganizationAddress, "organizationId"> | undefined;
  serviceAddress: Omit<OrganizationAddress, "organizationId"> | undefined;
};

export const getOrgDetails = async (
  organizationId: number,
): Promise<OrgNameAndAddresses> => {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
      organizationAddress: {
        omit: {
          organizationId: true,
        },
      },
      Vehicle: {
        select: {
          make: true,
        },
      },
    },
  });

  const makes = new Set<string>();
  organization.Vehicle.forEach((vehicle) => {
    makes.add(vehicle.make);
  });
  let recordsAddress: Omit<OrganizationAddress, "organizationId"> | undefined;
  let serviceAddress: Omit<OrganizationAddress, "organizationId"> | undefined;
  organization.organizationAddress.forEach((address) => {
    if (address.addressType === AddressType.RECORDS) {
      recordsAddress = address;
    } else if (address.addressType === AddressType.SERVICE) {
      serviceAddress = address;
    }
  });
  return {
    name: organization.name,
    makes: Array.from(makes),
    recordsAddress,
    serviceAddress,
  };
};

export const getSupplierClass = async (
  organizationId: number,
  modelYear: ModelYear,
  reportableNvValue: string,
): Promise<SupplierClass> => {
  const modelYearsArray = Object.values(ModelYear);
  const myIndex = modelYearsArray.findIndex((my) => my === modelYear);
  const precedingMys: (ModelYear | undefined)[] = [];
  for (let i = 1; i <= 3; i++) {
    const precedingMy = modelYearsArray[myIndex - i];
    precedingMys.push(precedingMy);
  }
  const whereClause = {
    OR: [
      { modelYear: precedingMys[0] },
      { modelYear: precedingMys[1] },
      { modelYear: precedingMys[2] },
    ],
    organizationId,
  };
  let volumes: SupplyVolume[] = [];
  if (modelYear < ModelYear.MY_2024) {
    volumes = await prisma.legacySalesVolume.findMany({
      where: whereClause,
    });
  } else {
    volumes = await prisma.supplyVolume.findMany({
      where: whereClause,
    });
  }
  let average = new Decimal(0);
  if (volumes.length === 3) {
    let total = 0;
    volumes.forEach((volume) => {
      total = total + volume.volume;
    });
    average = new Decimal(total).div(3);
  } else {
    // will throw on invalid reportableNvValue
    average = new Decimal(reportableNvValue);
  }
  if (average.lt(1000)) {
    return "small volume supplier";
  }
  if (average.gte(1000) && average.lt(5000)) {
    return "medium volume supplier";
  }
  return "large volume supplier";
};

export const getPrevEndingBalance = async (
  organizationId: number,
  complianceYear: ModelYear,
): Promise<ZevUnitRecord[]> => {
  const dominatedComplianceYears = getDominatedComplianceYears(complianceYear);
  const prevEndingBalance = await prisma.zevUnitEndingBalance.findFirst({
    select: {
      complianceYear: true,
    },
    where: {
      organizationId,
      complianceYear: {
        in: dominatedComplianceYears,
      },
    },
    orderBy: {
      complianceYear: "desc",
    },
  });
  const { closedLowerBound: currentCyLb } = getCompliancePeriod(complianceYear);
  if (!prevEndingBalance) {
    const transactions = await prisma.zevUnitTransaction.findMany({
      where: {
        organizationId,
        timestamp: {
          lt: currentCyLb,
        },
      },
      select: {
        type: true,
        vehicleClass: true,
        zevClass: true,
        modelYear: true,
        numberOfUnits: true,
      },
      orderBy: getZevUnitRecordsOrderByClause(),
    });
    const validatedTransactions = validatePrevBalanceTransactions(transactions);
    return flattenZevUnitRecords(validatedTransactions);
  }
  const result: ZevUnitRecord[] = [];
  const prevCy = prevEndingBalance.complianceYear;
  const endingBalance = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId,
      complianceYear: prevCy,
    },
    omit: {
      id: true,
      organizationId: true,
      complianceYear: true,
      initialNumberOfUnits: true,
    },
    orderBy: getZevUnitRecordsOrderByClause(),
  });
  endingBalance.forEach((record) => {
    const { finalNumberOfUnits, ...rest } = record;
    result.push({ ...rest, numberOfUnits: finalNumberOfUnits });
  });
  const { openUpperBound: prevCyUb } = getCompliancePeriod(prevCy);
  const transactions = await prisma.zevUnitTransaction.findMany({
    where: {
      organizationId,
      timestamp: {
        gte: prevCyUb,
        lt: currentCyLb,
      },
    },
    select: {
      type: true,
      vehicleClass: true,
      zevClass: true,
      modelYear: true,
      numberOfUnits: true,
    },
    orderBy: getZevUnitRecordsOrderByClause(),
  });
  const validatedTransactions = validatePrevBalanceTransactions(transactions);
  result.push(...flattenZevUnitRecords(validatedTransactions));
  return result;
};

export type MyrZevUnitTransaction = ZevUnitRecord & {
  referenceType: ReferenceType;
};

export const getTransactionsForModelYear = async (
  organizationId: number,
  modelYear: ModelYear,
  excludeReductions: boolean,
): Promise<MyrZevUnitTransaction[]> => {
  const result: MyrZevUnitTransaction[] = [];
  const { closedLowerBound, openUpperBound } = getCompliancePeriod(modelYear);
  const whereClause: Prisma.ZevUnitTransactionWhereInput = {
    organizationId,
    timestamp: {
      gte: closedLowerBound,
      lt: openUpperBound,
    },
  };
  if (excludeReductions) {
    whereClause.NOT = {
      referenceType: ReferenceType.OBLIGATION_REDUCTION,
    };
  }
  const transactions = await prisma.zevUnitTransaction.findMany({
    where: whereClause,
    omit: {
      id: true,
      organizationId: true,
      timestamp: true,
      referenceId: true,
      legacyReferenceId: true,
    },
    orderBy: getZevUnitRecordsOrderByClause(),
  });
  const referenceTypeMap: Partial<
    Record<ReferenceType, [ReferenceType, ZevUnitRecord[]]>
  > = {};
  transactions.forEach((transaction) => {
    const referenceType = transaction.referenceType;
    if (!referenceTypeMap[referenceType]) {
      referenceTypeMap[referenceType] = [referenceType, []];
    }
    referenceTypeMap[referenceType][1].push(transaction);
  });
  Object.values(referenceTypeMap).forEach(([referenceType, records]) => {
    const flattenedRecords = flattenZevUnitRecords(records);
    result.push(
      ...flattenedRecords.map((record) => ({ ...record, referenceType })),
    );
  });
  return result;
};

export const getZevUnitData = async (
  orgId: number,
  modelYear: ModelYear,
  nvValues: NvValues,
  zevClassOrdering: ZevClass[],
  adjustments: AdjustmentPayload[],
  forReassessment: boolean,
) => {
  const reportableNvValue = nvValues[VehicleClass.REPORTABLE];
  if (!reportableNvValue) {
    throw new Error("No Reportable NV Value!");
  }
  const supplierClass = await getSupplierClass(
    orgId,
    modelYear,
    reportableNvValue,
  );
  const prevEndingBalance = await getPrevEndingBalance(orgId, modelYear);
  const complianceReductions = getComplianceRatioReductions(
    nvValues,
    modelYear,
    supplierClass,
  );
  const currentTransactions = await getTransactionsForModelYear(
    orgId,
    modelYear,
    forReassessment,
  );
  const transformedAdjustments = getTransformedAdjustments(adjustments);
  const [endingBalance, offsettedCredits] = calculateBalance(
    [
      ...prevEndingBalance,
      ...currentTransactions,
      ...complianceReductions,
      ...transformedAdjustments,
    ],
    zevClassOrdering,
    modelYear,
  );
  return {
    supplierClass,
    prevEndingBalance,
    complianceReductions,
    currentTransactions,
    endingBalance,
    offsettedCredits,
  };
};

export const createHistory = async (
  modelYearReportId: number,
  userId: number,
  userAction: ModelYearReportStatus,
  comment?: string,
  transactionClient?: TransactionClient,
): Promise<number> => {
  const client = transactionClient ?? prisma;
  const { id } = await client.modelYearReportHistory.create({
    data: {
      modelYearReportId,
      userId,
      userAction,
      comment,
    },
  });
  return id;
};

export const createReassessmentHistory = async (
  reassessmentId: number,
  userId: number,
  userAction: ReassessmentStatus,
  comment?: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.reassessmentHistory.create({
    data: {
      reassessmentId,
      userId,
      userAction,
      comment,
    },
  });
};

export type ReassessableMyr = {
  myrId: number | null;
  isLegacy: boolean | null;
};

export const getReassessableMyrData = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<ReassessableMyr> => {
  const result: ReassessableMyr = {
    myrId: null,
    isLegacy: null,
  };
  const myrs = await prisma.modelYearReport.findMany({
    where: {
      organizationId,
      status: ModelYearReportStatus.ASSESSED,
    },
    select: {
      id: true,
      modelYear: true,
    },
    orderBy: {
      modelYear: "desc",
    },
    take: 5,
  });
  myrs.forEach((myr) => {
    if (myr.modelYear === modelYear) {
      result.myrId = myr.id;
      result.isLegacy = false;
    }
  });
  if (result.myrId !== null && result.isLegacy !== null) {
    return result;
  }
  const legacyAssessedMyrs =
    await prisma.legacyAssessedModelYearReport.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        modelYear: true,
      },
      orderBy: {
        modelYear: "desc",
      },
      take: 5 - myrs.length,
    });
  legacyAssessedMyrs.forEach((legacyMyr) => {
    if (legacyMyr.modelYear === modelYear) {
      result.myrId = legacyMyr.id;
      result.isLegacy = true;
    }
  });
  return result;
};
