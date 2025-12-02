import Excel from "exceljs";
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
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import {
  validatePrevBalanceTransactions,
  getZevUnitRecordsOrderByClause,
  getComplianceRatioReductions,
  getTransformedAdjustments,
  parseMyrForAssessmentData,
  parseAssesmentForData,
} from "./utilsServer";
import { TransactionClient } from "@/types/prisma";
import { AdjustmentPayload, NvValues } from "./actions";
import { getObject } from "@/app/lib/minio";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";

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
    vehicleClass: VehicleClass.REPORTABLE,
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
  legacyMyrId: number | null;
};

export const getReassessableMyrData = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<ReassessableMyr> => {
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
  for (const myr of myrs) {
    if (myr.modelYear === modelYear) {
      return {
        myrId: myr.id,
        legacyMyrId: null,
      };
    }
  }
  const legacyAssessedMyrs =
    await prisma.legacyAssessedModelYearReport.findMany({
      where: {
        organizationId,
      },
      select: {
        legacyId: true,
        modelYear: true,
      },
      orderBy: {
        modelYear: "desc",
      },
      take: 5 - myrs.length,
    });
  for (const legacyMyr of legacyAssessedMyrs) {
    if (legacyMyr.modelYear === modelYear) {
      return {
        myrId: null,
        legacyMyrId: legacyMyr.legacyId,
      };
    }
  }
  return {
    myrId: null,
    legacyMyrId: null,
  };
};

export type MyrDataForAssessment = {
  orgName: string;
  organizationId: number;
  modelYear: ModelYear;
  nvValues: NvValues;
  zevClassOrdering: ZevClass[];
};

export const getMyrDataForAssessment = async (
  myrId: number,
): Promise<MyrDataForAssessment> => {
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
    },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      modelYear: true,
      objectName: true,
    },
  });
  if (!myr) {
    throw new Error("Model Year Report not found!");
  }
  const myrFile = await getObject(myr.objectName);
  const myrBuf = await getArrayBuffer(myrFile);
  const myrWorkbook = new Excel.Workbook();
  await myrWorkbook.xlsx.load(myrBuf);
  const data = parseMyrForAssessmentData(myrWorkbook);
  return {
    orgName: myr.organization.name,
    organizationId: myr.organization.id,
    modelYear: myr.modelYear,
    ...data,
  };
};

export const getAssessmentSystemData = async (objectName: string) => {
  const assessmentFile = await getObject(objectName);
  const assessmentBuf = await getArrayBuffer(assessmentFile);
  const assessmentWorkbook = new Excel.Workbook();
  await assessmentWorkbook.xlsx.load(assessmentBuf);
  return parseAssesmentForData(assessmentWorkbook);
};

export const getMyrDataForLegacyReassessment = async (
  orgId: number,
  modelYear: ModelYear,
): Promise<MyrDataForAssessment> => {
  const legacyMyr = await prisma.legacyAssessedModelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId: orgId,
        modelYear,
      },
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  if (!legacyMyr) {
    throw new Error("Legacy MYR not found!");
  }
  const nvValues: NvValues = {};
  for (const vehicleClass of Object.values(VehicleClass)) {
    const whereClause = {
      organizationId_vehicleClass_modelYear: {
        organizationId: orgId,
        vehicleClass,
        modelYear,
      },
    };
    const selectClause = {
      volume: true,
    };
    const salesVolume = await prisma.legacySalesVolume.findUnique({
      where: whereClause,
      select: selectClause,
    });
    const supplyVolume = await prisma.supplyVolume.findUnique({
      where: whereClause,
      select: selectClause,
    });
    if (salesVolume) {
      nvValues[vehicleClass] = new Decimal(salesVolume.volume).toFixed(0);
    }
    if (supplyVolume) {
      nvValues[vehicleClass] = new Decimal(supplyVolume.volume).toFixed(0);
    }
  }
  return {
    orgName: legacyMyr.organization.name,
    organizationId: legacyMyr.organizationId,
    modelYear: legacyMyr.modelYear,
    nvValues,
    zevClassOrdering: legacyMyr.zevClassOrdering,
  };
};

export const getLegacyAssessedMyr = async (
  organizationId: number,
  modelYear: ModelYear,
) => {
  return await prisma.legacyAssessedModelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId,
        modelYear,
      },
    },
    select: {
      legacyId: true,
    },
  });
};

export const updateMyrReassessmentStatus = async (
  myrId: number,
  status: ReassessmentStatus,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.modelYearReport.update({
    where: {
      id: myrId,
    },
    data: {
      reassessmentStatus: status,
      supplierReassessmentStatus:
        status === ReassessmentStatus.ISSUED ? ReassessmentStatus.ISSUED : null,
    },
  });
};
