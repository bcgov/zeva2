import Excel from "exceljs";
import {
  getAdjacentYear,
  getComplianceDate,
  getCompliancePeriod,
  getDominatedComplianceYears,
} from "@/app/lib/utils/complianceYear";
import { prisma } from "@/lib/prisma";
import {
  applySingleTransferAway,
  applyTransfersAway,
  calculateBalance,
  flattenZevUnitRecords,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import {
  AddressType,
  CreditApplicationStatus,
  ModelYear,
  ModelYearReportStatus,
  ReassessmentStatus,
  ReferenceType,
  SupplierClass,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import {
  SupplyVolumeModel,
  ZevUnitTransactionWhereInput,
} from "@/prisma/generated/models";
import { Decimal } from "decimal.js";
import {
  getZevUnitRecordsOrderByClause,
  getComplianceRatioReductions,
  getTransformedAdjustments,
  parseAssesmentForData,
  getEmptyBalance,
} from "./utilsServer";
import { TransactionClient } from "@/types/prisma";
import { AdjustmentPayload, NvValues } from "./actions";
import { getObjectAsBuffer } from "@/app/lib/services/s3";

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
      supplierClass: true,
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
    supplierClass: organization.supplierClass,
  };
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
  precedingMys.reverse();
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
  let volumes: SupplyVolumeModel[] = [];
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

export const getPrevBalance = async (
  type: "endOfCd" | "afterCd",
  organizationId: number,
  complianceYear: ModelYear,
): Promise<ZevUnitRecord[]> => {
  const prevComplianceYear = getAdjacentYear("prev", complianceYear);
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
    const result = flattenZevUnitRecords(applyTransfersAway(transactions));
    if (result.length === 0) {
      return getEmptyBalance(prevComplianceYear);
    }
    return result;
  }
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
    },
    orderBy: getZevUnitRecordsOrderByClause(),
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
  if (type === "endOfCd" && transactions.length === 0) {
    const result = endingBalance.map((record) => {
      const { initialNumberOfUnits, finalNumberOfUnits, ...rest } = record;
      return { ...rest, numberOfUnits: initialNumberOfUnits };
    });
    if (result.length === 0) {
      return getEmptyBalance(prevComplianceYear);
    }
    return result;
  }
  const result: ZevUnitRecord[] = [];
  for (const record of endingBalance) {
    const { initialNumberOfUnits, finalNumberOfUnits, ...rest } = record;
    result.push({ ...rest, numberOfUnits: finalNumberOfUnits });
  }
  result.push(...flattenZevUnitRecords(applyTransfersAway(transactions)));
  if (result.length === 0) {
    return getEmptyBalance(prevComplianceYear);
  }
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
  const whereClause: ZevUnitTransactionWhereInput = {
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
        supplierStatus: CreditApplicationStatus.SUBMITTED,
      },
    },
    by: ["vehicleClass", "zevClass", "modelYear"],
    _sum: {
      numberOfUnits: true,
    },
  });
  for (const record of groupBy) {
    const recordMy = record.modelYear;
    const numberOfUnits = record._sum.numberOfUnits;
    if (recordMy === modelYear && numberOfUnits) {
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
  const prevEndOfCdBalance = await getPrevBalance("endOfCd", orgId, modelYear);
  const prevAfterCdBalance = await getPrevBalance("afterCd", orgId, modelYear);
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
      ...prevAfterCdBalance,
      ...currentTransactions,
      ...pendingSupplyCredits,
      ...complianceReductions,
      ...transformedAdjustments,
    ],
    zevClassOrdering,
  );
  let endingBalanceToUse = endingBalance;
  if (endingBalanceToUse.length === 0) {
    endingBalanceToUse = getEmptyBalance(modelYear);
  }
  return {
    prevEndOfCdBalance,
    prevAfterCdBalance,
    complianceReductions,
    currentTransactions,
    pendingSupplyCredits,
    endingBalance: endingBalanceToUse,
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

// returns myrId if non-legacy reassessment,
// null if legacy reassessment,
// throws error if doing a reassessment is not allowed.
export const getDataForReassessment = async (
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

export type MyrDataForAssessment = {
  nvValues: NvValues;
  zevClassOrdering: ZevClass[];
};

export const getAssessmentSystemData = async (objectName: string) => {
  const assessmentBuf = await getObjectAsBuffer(objectName);
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

export const createSupplementaryHistory = async (
  supplementaryReportId: number,
  userId: number,
  userAction: ModelYearReportStatus,
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

// returns myrId if non-legacy supplementary,
// null if legacy supplementary,
// throws error if doing a supplementary is not allowed.
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
      status: ModelYearReportStatus.ASSESSED,
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
  if (myr?.id) {
    return myr.id;
  }
  return null;
};

// upon issuance of an assessment or reassessment,
// transfers may become uncovered due to
// a new ending balance being created
export const getTransfersAwayThatShouldBecomeDebits = async (
  organizationId: number,
  complianceYear: ModelYear,
  newEndingBalance: ZevUnitRecord[],
) => {
  const result: { id: number; numberOfUnits: Decimal }[] = [];
  const { openUpperBound: gteDate } = getCompliancePeriod(complianceYear);
  const transactions = await prisma.zevUnitTransaction.findMany({
    where: {
      timestamp: {
        gte: gteDate,
      },
      organizationId,
      type: {
        in: [TransactionType.CREDIT, TransactionType.TRANSFER_AWAY],
      },
    },
    select: {
      id: true,
      timestamp: true,
      type: true,
      numberOfUnits: true,
      vehicleClass: true,
      zevClass: true,
      modelYear: true,
    },
    orderBy: {
      timestamp: "asc",
    },
  });
  const transfersAway: (ZevUnitRecord & {
    id: number;
    type: typeof TransactionType.TRANSFER_AWAY;
    timestamp: Date;
  })[] = [];
  for (const record of transactions) {
    if (record.type === TransactionType.TRANSFER_AWAY) {
      transfersAway.push({ ...record, type: TransactionType.TRANSFER_AWAY });
    }
  }
  if (transfersAway.length === 0) {
    return [];
  }
  const endingCredits: (ZevUnitRecord & {
    type: typeof TransactionType.CREDIT;
  })[] = [];
  for (const record of newEndingBalance) {
    if (record.type === TransactionType.CREDIT) {
      endingCredits.push({ ...record, type: TransactionType.CREDIT });
    }
  }
  const credits: (ZevUnitRecord & {
    type: typeof TransactionType.CREDIT;
    timestamp: Date;
  })[] = [];
  for (const record of transactions) {
    if (record.type === TransactionType.CREDIT) {
      credits.push({ ...record, type: TransactionType.CREDIT });
    }
  }
  let creditsToCoverTransfers = endingCredits;
  for (const [index, transferAway] of transfersAway.entries()) {
    if (index === 0) {
      creditsToCoverTransfers = creditsToCoverTransfers.concat(
        credits.filter((record) => record.timestamp < transferAway.timestamp),
      );
    } else {
      const prevTransfer = transfersAway[index - 1];
      creditsToCoverTransfers = creditsToCoverTransfers.concat(
        credits.filter(
          (record) =>
            prevTransfer.timestamp < record.timestamp &&
            record.timestamp < transferAway.timestamp,
        ),
      );
    }
    const { remainingCredits, transferAwayThatShouldBecomeDebit } =
      applySingleTransferAway(creditsToCoverTransfers, transferAway);
    creditsToCoverTransfers = remainingCredits;
    if (transferAwayThatShouldBecomeDebit) {
      result.push(transferAwayThatShouldBecomeDebit);
    }
  }
  return result;
};

export const updateOrgSupplierClass = async (
  organizationId: number,
  modelYear: ModelYear,
  supplierClass: SupplierClass,
  fromMyr: boolean,
  transactionClient?: TransactionClient,
) => {
  const updateClass = async () => {
    const client = transactionClient ?? prisma;
    await client.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        supplierClass,
      },
    });
  };
  if (fromMyr) {
    updateClass();
  } else {
    const latestAssessedMyr = await prisma.modelYearReport.findFirst({
      where: {
        organizationId,
        status: ModelYearReportStatus.ASSESSED,
      },
      select: {
        modelYear: true,
      },
      orderBy: {
        modelYear: "desc",
      },
    });
    if (latestAssessedMyr && latestAssessedMyr.modelYear === modelYear) {
      updateClass();
    }
  }
};

export const assessReassessment = async (
  modelYearReportId: number | null,
  organizationId: number,
  modelYear: ModelYear,
  objectName: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  const legacyMyr = await getLegacyAssessedMyr(organizationId, modelYear);
  const complianceDate = getComplianceDate(modelYear);
  const compliancePeriod = getCompliancePeriod(modelYear);
  const reassessmentData = await getAssessmentSystemData(objectName);
  const endingBalance = reassessmentData.endingBalance.map((record) => {
    return { ...record, numberOfUnits: record.finalNumberOfUnits };
  });
  const transfersAwayThatShouldBecomeDebits =
    await getTransfersAwayThatShouldBecomeDebits(
      organizationId,
      modelYear,
      endingBalance,
    );
  const volumeUpsertClauses = reassessmentData.nvValues.map(
    ([vehicleClass, volume]) => ({
      where: {
        organizationId_vehicleClass_modelYear: {
          organizationId,
          vehicleClass,
          modelYear,
        },
      },
      create: {
        organizationId,
        modelYear,
        vehicleClass,
        volume,
      },
      update: {
        volume,
      },
    }),
  );
  if (modelYear < ModelYear.MY_2024) {
    for (const clause of volumeUpsertClauses) {
      await client.legacySalesVolume.upsert(clause);
    }
  } else {
    for (const clause of volumeUpsertClauses) {
      await client.supplyVolume.upsert(clause);
    }
  }
  await updateOrgSupplierClass(
    organizationId,
    modelYear,
    reassessmentData.supplierClass,
    false,
    client,
  );
  await client.zevUnitTransaction.deleteMany({
    where: {
      organizationId,
      referenceType: ReferenceType.COMPLIANCE_RATIO_REDUCTION,
      AND: [
        { timestamp: { gte: compliancePeriod.closedLowerBound } },
        { timestamp: { lt: compliancePeriod.openUpperBound } },
      ],
    },
  });
  await client.zevUnitTransaction.createMany({
    data: reassessmentData.transactions.map((transaction) => {
      return {
        ...transaction,
        organizationId,
        referenceId: modelYearReportId,
        legacyReferenceId: legacyMyr ? legacyMyr.legacyId : null,
        timestamp: complianceDate,
      };
    }),
  });
  await client.zevUnitEndingBalance.deleteMany({
    where: {
      organizationId,
      complianceYear: modelYear,
    },
  });
  await client.zevUnitEndingBalance.createMany({
    data: reassessmentData.endingBalance.map((record) => {
      return { ...record, organizationId, complianceYear: modelYear };
    }),
  });
  for (const record of transfersAwayThatShouldBecomeDebits) {
    await client.zevUnitTransaction.update({
      where: {
        id: record.id,
      },
      data: {
        type: TransactionType.DEBIT,
        numberOfUnits: record.numberOfUnits,
      },
    });
  }
  if (modelYearReportId) {
    await client.modelYearReport.update({
      where: {
        id: modelYearReportId,
      },
      data: {
        compliant: reassessmentData.compliant,
        reportableNvValue: reassessmentData.reportableNvValue,
        supplierClass: reassessmentData.supplierClass,
      },
    });
  }
};
