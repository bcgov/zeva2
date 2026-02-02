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
  ModelYear,
  ModelYearReportStatus,
  OrganizationAddress,
  Prisma,
  ReassessmentStatus,
  ReferenceType,
  Role,
  SupplementaryReportStatus,
  SupplierClass,
  SupplyVolume,
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

export type VehicleStatistics = {
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  make: string;
  modelName: string;
  modelYear: ModelYear;
  zevType: ZevType;
  range: number;
  submittedCount: number;
  issuedCount: number;
}[];

export const getVehicleStatistics = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<VehicleStatistics> => {
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
    volume: { gt: 0 },
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
    const total = volumes.reduce((acc, cv) => {
      return acc + cv.volume;
    }, 0);
    average = new Decimal(total).div(3);
  } else {
    // will throw on invalid reportableNvValue
    average = new Decimal(reportableNvValue);
  }
  if (average.lt(1000)) {
    return SupplierClass.SMALL_VOLUME_SUPPLIER;
  }
  if (average.gte(1000) && average.lt(5000)) {
    return SupplierClass.MEDIUM_VOLUME_SUPPLIER;
  }
  return SupplierClass.LARGE_VOLUME_SUPPLIER;
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
      referenceType: ReferenceType.COMPLIANCE_RATIO_REDUCTION,
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

// returns {sequenceNumber, myrId} if non-legacy reassessment,
// {sequenceNumber, null} if legacy reassessment,
// throws error if creating a reassessment is not allowed.
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
    myrId: myr ? myr.id : null,
  };
};

export type MyrDataForAssessment = {
  nvValues: NvValues;
  zevClassOrdering: ZevClass[];
};

export const getMyrDataForAssessment = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<MyrDataForAssessment> => {
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId,
        modelYear,
      },
    },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
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
  return parseMyrForAssessmentData(myrWorkbook);
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
      supplierReassessmentStatus:
        status === ReassessmentStatus.ISSUED ? ReassessmentStatus.ISSUED : null,
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
    latestSupplementary.status !== SupplementaryReportStatus.ACKNOWLEDGED
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

export const canCreateReassessment = async (
  myrId: number,
  userIsGov: boolean,
  userRoles: Role[],
) => {
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return false;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
      status: ModelYearReportStatus.ASSESSED,
    },
    select: {
      Reassessment: {
        select: {
          status: true,
        },
        orderBy: {
          sequenceNumber: "desc",
        },
      },
    },
  });
  if (!myr) {
    return false;
  }
  if (
    myr.Reassessment.length > 0 &&
    myr.Reassessment[0].status !== ReassessmentStatus.ISSUED
  ) {
    return false;
  }
  return true;
};

export const canCreateSupplementary = async (
  myrId: number,
  userIsGov: boolean,
) => {
  if (userIsGov) {
    return false;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
      status: {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
    select: {
      supplementaryReports: {
        select: {
          status: true,
        },
        orderBy: {
          sequenceNumber: "desc",
        },
      },
    },
  });
  if (!myr) {
    return false;
  }
  if (
    myr.supplementaryReports.length > 0 &&
    myr.supplementaryReports[0].status !==
      SupplementaryReportStatus.ACKNOWLEDGED
  ) {
    return false;
  }
  return true;
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
