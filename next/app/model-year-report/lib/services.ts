import Excel from "exceljs";
import {
  getCompliancePeriod,
  getDominatedComplianceYears,
} from "@/app/lib/utils/complianceYear";
import { prisma } from "@/lib/prisma";
import {
  applyTransfersAway,
  calculateBalance,
  flattenZevUnitRecords,
  UncoveredTransfer,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import {
  AddressType,
  CreditApplicationStatus,
  ModelYear,
  ModelYearReportStatus,
  Prisma,
  ReassessmentStatus,
  ReferenceType,
  Role,
  SupplementaryReportStatus,
  SupplierClass,
  SupplyVolume,
  TransactionType,
  VehicleClass,
  VehicleStatus,
  ZevClass,
  ZevType,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import {
  validatePrevBalanceTransactions,
  getZevUnitRecordsOrderByClause,
  getComplianceRatioReductions,
  getTransformedAdjustments,
  parseAssesmentForData,
} from "./utilsServer";
import { TransactionClient } from "@/types/prisma";
import { AdjustmentPayload, NvValues } from "./actions";
import { getObject } from "@/app/lib/minio";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";

export const getSupplierDetails = async (organizationId: number) => {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
      organizationAddress: true,
      Vehicle: {
        select: {
          make: true,
        },
      },
    },
  });
  const makes = new Set<string>();
  for (const vehicle of organization.Vehicle) {
    makes.add(vehicle.make);
  }
  let recordsAddress;
  let serviceAddress;
  for (const address of organization.organizationAddress) {
    if (address.addressType === AddressType.RECORDS) {
      recordsAddress = address;
    } else if (address.addressType === AddressType.SERVICE) {
      serviceAddress = address;
    }
  }
  return {
    legalName: organization.name,
    makes: Array.from(makes),
    recordsAddress,
    serviceAddress,
  };
};

export type VehicleStatistic = {
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  make: string;
  modelName: string;
  modelYear: ModelYear;
  zevType: ZevType;
  range: number;
  submittedCount: number;
  issuedCount: number;
};

export const getVehicleStatistics = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<VehicleStatistic[]> => {
  return await prisma.vehicle.findMany({
    where: {
      organizationId,
      modelYear,
      status: VehicleStatus.VALIDATED,
    },
    select: {
      vehicleClass: true,
      zevClass: true,
      make: true,
      modelName: true,
      modelYear: true,
      zevType: true,
      range: true,
      submittedCount: true,
      issuedCount: true,
    },
  });
};

export const getSupplierClassAndVolumes = async (
  organizationId: number,
  modelYear: ModelYear,
  reportableNvValue: string,
): Promise<{
  supplierClass: SupplierClass;
  volumes: [ModelYear, VehicleClass, number][];
}> => {
  const vehicleClassToUse = VehicleClass.REPORTABLE;
  const modelYearsArray = Object.values(ModelYear);
  const myIndex = modelYearsArray.findIndex((my) => my === modelYear);
  const precedingMys: ModelYear[] = [];
  for (let i = 1; i <= 3; i++) {
    const precedingMy = modelYearsArray[myIndex - i];
    if (precedingMy) {
      precedingMys.push(precedingMy);
    }
  }
  if (precedingMys.length !== 3) {
    throw new Error("Error getting supplier class!");
  }
  const whereClause = {
    OR: [
      { modelYear: precedingMys[0] },
      { modelYear: precedingMys[1] },
      { modelYear: precedingMys[2] },
    ],
    organizationId,
    vehicleClass: vehicleClassToUse,
    volume: { gt: 0 },
  };
  const orderBy: { modelYear: "asc" | "desc" } = {
    modelYear: "desc",
  };
  let volumes: SupplyVolume[] = [];
  if (modelYear < ModelYear.MY_2024) {
    volumes = await prisma.legacySalesVolume.findMany({
      where: whereClause,
      orderBy,
    });
  } else {
    volumes = await prisma.supplyVolume.findMany({
      where: whereClause,
      orderBy,
    });
  }
  let average = new Decimal(0);
  if (volumes.length === 3) {
    const total = volumes.reduce((acc, cv) => {
      return acc + cv.volume;
    }, 0);
    average = new Decimal(total).div(3);
  } else {
    // will throw on invalid reportableNvValue
    average = new Decimal(reportableNvValue);
  }
  let supplierClass;
  if (average.lt(1000)) {
    supplierClass = SupplierClass.SMALL_VOLUME_SUPPLIER;
  } else if (average.gte(1000) && average.lt(5000)) {
    supplierClass = SupplierClass.MEDIUM_VOLUME_SUPPLIER;
  } else {
    supplierClass = SupplierClass.LARGE_VOLUME_SUPPLIER;
  }
  const volumesResult: [ModelYear, VehicleClass, number][] = [];
  for (const my of precedingMys) {
    const volume = volumes.find((v) => v.modelYear === my);
    if (volume) {
      volumesResult.push([my, volume.vehicleClass, volume.volume]);
    } else {
      volumesResult.push([my, vehicleClassToUse, 0]);
    }
  }
  return {
    supplierClass,
    volumes: volumesResult,
  };
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
): Promise<MyrZevUnitTransaction[]> => {
  const result: MyrZevUnitTransaction[] = [];
  const { closedLowerBound, openUpperBound } = getCompliancePeriod(modelYear);
  const whereClause: Prisma.ZevUnitTransactionWhereInput = {
    organizationId,
    timestamp: {
      gte: closedLowerBound,
      lt: openUpperBound,
    },
    NOT: {
      referenceType: ReferenceType.COMPLIANCE_RATIO_REDUCTION,
    },
  };
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

export const getPendingSupplyCredits = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<ZevUnitRecord[]> => {
  const result: ZevUnitRecord[] = [];
  const groupBy = await prisma.creditApplicationRecord.groupBy({
    where: {
      creditApplication: {
        organizationId,
        status: {
          in: [
            CreditApplicationStatus.SUBMITTED,
            CreditApplicationStatus.RECOMMEND_APPROVAL,
            CreditApplicationStatus.RETURNED_TO_ANALYST,
          ],
        },
      },
      modelYear,
    },
    by: ["vehicleClass", "zevClass"],
    _sum: {
      numberOfUnits: true,
    },
  });
  for (const record of groupBy) {
    const numberOfUnits = record._sum.numberOfUnits;
    if (numberOfUnits) {
      result.push({
        numberOfUnits,
        vehicleClass: record.vehicleClass,
        zevClass: record.zevClass,
        modelYear,
        type: TransactionType.CREDIT,
      });
    }
  }
  return result;
};

export const getZevUnitData = async (
  orgId: number,
  modelYear: ModelYear,
  supplierClass: SupplierClass,
  nvValues: NvValues,
  zevClassOrdering: ZevClass[],
  adjustments: AdjustmentPayload[],
  includePendingSupplyCredits: boolean,
) => {
  const prevEndingBalance = await getPrevEndingBalance(orgId, modelYear);
  const complianceReductions = getComplianceRatioReductions(
    nvValues,
    modelYear,
    supplierClass,
  );
  const currentTransactions = await getTransactionsForModelYear(
    orgId,
    modelYear,
  );
  let pendingSupplyCredits: ZevUnitRecord[] = [];
  if (includePendingSupplyCredits) {
    pendingSupplyCredits = await getPendingSupplyCredits(orgId, modelYear);
  }
  const transformedAdjustments = getTransformedAdjustments(adjustments);
  const [endingBalance, offsettedCredits] = calculateBalance(
    [
      ...prevEndingBalance,
      ...currentTransactions,
      ...pendingSupplyCredits,
      ...complianceReductions,
      ...transformedAdjustments,
    ],
    zevClassOrdering,
    modelYear,
  );
  return {
    prevEndingBalance,
    complianceReductions,
    currentTransactions,
    pendingSupplyCredits,
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

// returns a (non-legacy) myrId if (orgId, modelYear) can be associated with
// such a myrId
export const validateReassesmentTimeLimit = async (
  organizationId: number,
  modelYear: ModelYear,
) => {
  let myr;
  let legacyMyr;
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
  for (const report of myrs) {
    if (report.modelYear === modelYear) {
      myr = report;
      break;
    }
  }
  const legacyAssessedMyrs =
    await prisma.legacyAssessedModelYearReport.findMany({
      where: {
        organizationId,
      },
      select: {
        modelYear: true,
      },
      orderBy: {
        modelYear: "desc",
      },
      take: 5 - myrs.length,
    });
  for (const report of legacyAssessedMyrs) {
    if (report.modelYear === modelYear) {
      legacyMyr = report;
      break;
    }
  }
  if ((!myr && !legacyMyr) || (myr && legacyMyr)) {
    throw new Error();
  }
  if (myr?.id) {
    return myr.id;
  }
  return null;
};

// returns {sequenceNumber, myrId} if non-legacy reassessment,
// {sequenceNumber, null} if legacy reassessment,
// throws error if creating a reassessment is not allowed.
export const getDataForReassessment = async (
  organizationId: number,
  modelYear: ModelYear,
) => {
  const myrId = await validateReassesmentTimeLimit(organizationId, modelYear);
  let sequenceNumber = 0;
  const latestReassessment = await prisma.reassessment.findFirst({
    where: {
      organizationId,
      modelYear,
    },
    select: {
      status: true,
      sequenceNumber: true,
    },
    orderBy: {
      sequenceNumber: "desc",
    },
  });
  if (
    latestReassessment &&
    latestReassessment.status !== ReassessmentStatus.ISSUED
  ) {
    throw new Error();
  }
  if (latestReassessment) {
    sequenceNumber = latestReassessment.sequenceNumber + 1;
  }
  return {
    sequenceNumber,
    myrId,
  };
};

export type MyrDataForAssessment = {
  nvValues: NvValues;
  zevClassOrdering: ZevClass[];
};

export const getAssessmentSystemData = async (object: string | ArrayBuffer) => {
  let assessmentBuf: ArrayBuffer;
  if (typeof object === "string") {
    const assessmentFile = await getObject(object);
    assessmentBuf = await getArrayBuffer(assessmentFile);
  } else {
    assessmentBuf = object;
  }
  const assessmentWorkbook = new Excel.Workbook();
  await assessmentWorkbook.xlsx.load(assessmentBuf);
  return parseAssesmentForData(assessmentWorkbook);
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
  status: ReassessmentStatus | null,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.modelYearReport.update({
    where: {
      id: myrId,
    },
    data: {
      reassessmentStatus: status,
    },
  });
};

export const createSupplementaryHistory = async (
  supplementaryReportId: number,
  userId: number,
  userAction: SupplementaryReportStatus,
  comment?: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.supplementaryReportHistory.create({
    data: {
      supplementaryReportId,
      userId,
      userAction,
      comment,
    },
  });
};

// returns {sequenceNumber, myrId} if non-legacy supplementary,
// {sequenceNumber, null} if legacy supplementary,
// throws error if creating a supplementary is not allowed.
export const getDataForSupplementary = async (
  organizationId: number,
  modelYear: ModelYear,
) => {
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId,
        modelYear: modelYear,
      },
      status: {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
    select: {
      id: true,
    },
  });
  const legacyMyr = await prisma.legacyAssessedModelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId,
        modelYear: modelYear,
      },
    },
    select: {
      id: true,
    },
  });
  if ((!myr && !legacyMyr) || (myr && legacyMyr)) {
    throw new Error();
  }
  let sequenceNumber = 0;
  const latestSupplementary = await prisma.supplementaryReport.findFirst({
    where: {
      organizationId,
      modelYear,
    },
    select: {
      status: true,
      sequenceNumber: true,
    },
    orderBy: {
      sequenceNumber: "desc",
    },
  });
  if (
    latestSupplementary &&
    latestSupplementary.status === SupplementaryReportStatus.DRAFT
  ) {
    throw new Error();
  }
  if (latestSupplementary) {
    sequenceNumber = latestSupplementary.sequenceNumber + 1;
  }
  return {
    sequenceNumber,
    myrId: myr ? myr.id : null,
  };
};

export const updateMyrSupplementaryStatus = async (
  myrId: number,
  status: SupplementaryReportStatus | null,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.modelYearReport.update({
    where: {
      id: myrId,
    },
    data: {
      supplementaryReportStatus: status,
    },
  });
};

// upon issuance of an assessment or reassessment,
// transfers may become uncovered due to the backdating
// of compliance ratio reductions or debit adjustments
export const areTransfersCovered = async (
  organizationId: number,
  complianceYear: ModelYear,
  newEndingBalance: ZevUnitRecord[],
) => {
  const { openUpperBound: gteDate } = getCompliancePeriod(complianceYear);
  const currentTransactions = await prisma.zevUnitTransaction.findMany({
    where: {
      timestamp: {
        gte: gteDate,
      },
      organizationId,
    },
    select: {
      type: true,
      numberOfUnits: true,
      vehicleClass: true,
      zevClass: true,
      modelYear: true,
    },
  });
  const transactions = newEndingBalance.concat(currentTransactions);
  try {
    applyTransfersAway(transactions);
  } catch (e) {
    if (e instanceof UncoveredTransfer) {
      return false;
    } else {
      throw e;
    }
  }
  return true;
};
