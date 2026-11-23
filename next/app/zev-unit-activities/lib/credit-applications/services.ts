import axios from "axios";
import { prisma } from "@/lib/prisma";
import {
  AddressType,
  CreditApplicationStatus,
  ModelYear,
  VehicleStatus,
  Role,
  ModelYearReportStatus,
  ReferenceType,
} from "@/prisma/generated/enums";
import {
  CreditApplicationWhereInput,
  CreditApplicationWhereUniqueInput,
} from "@/prisma/generated/models";
import {
  GovCaStatRecord,
  ImpermissableCaSubmission,
  mapOfStatusToSupplierStatus,
  ZevModelsMap,
} from "./constants";
import { Attachment } from "@/app/lib/constants/attachment";
import { TransactionClient } from "@/types/prisma";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  getModelYearEnumsToStringsMap,
  getStringsToModelYearsEnumsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import {
  getIsoYmdString,
  getTimeWithTz,
  validateDate,
} from "@/app/lib/utils/date";
import { ChatComment } from "@/app/lib/constants/chatComment";
import { getZevModelKey } from "@/app/zev-models/lib/utils";
import {
  getComplianceDate,
  getComplianceYear,
  getPreviousComplianceYear,
  within20DayPeriod,
} from "@/app/lib/utils/complianceYear";
import Decimal from "decimal.js";
import {
  getStatsKey,
  getSupplierCreditStatsKey,
  getSupplierCreditStatRecords,
  getSupplierVinStatRecords,
  getGovStatRecords,
} from "./utils";
import {
  getCaRecordData,
  getCaRecordOnOrBeforeCd,
  getComplianceYearData,
  getTransactionKey,
  getTransactionsAndTimestamps,
} from "./utilsServer";

export const getCreditApplicationGov = async (
  creditApplicationId: number,
  userRoles: Role[],
) => {
  let whereClause: CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  const notClause: CreditApplicationWhereInput[] = [
    {
      status: CreditApplicationStatus.DRAFT,
    },
  ];
  if (userRoles.includes(Role.DIRECTOR)) {
    notClause.push({
      status: {
        in: [
          CreditApplicationStatus.RETURNED_TO_ANALYST,
          CreditApplicationStatus.SUBMITTED,
          CreditApplicationStatus.VALIDATED,
        ],
      },
    });
  }
  whereClause = { ...whereClause, NOT: notClause };
  return await prisma.creditApplication.findUnique({
    where: whereClause,
    include: {
      organization: true,
      CreditApplicationAttachment: {
        select: {
          fileName: true,
        },
      },
      CreditApplicationHistory: {
        where: {
          userAction: {
            not: CreditApplicationStatus.DRAFT,
          },
        },
        select: {
          userAction: true,
          timestamp: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      },
    },
  });
};

export const getCreditApplicationSupplier = async (
  creditApplicationId: number,
  orgId: number,
) => {
  let whereClause: CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
    organizationId: orgId,
  };
  return await prisma.creditApplication.findUnique({
    where: whereClause,
    include: {
      organization: true,
      CreditApplicationAttachment: {
        select: {
          fileName: true,
        },
      },
      _count: {
        select: {
          CreditApplicationRecord: {
            where: {
              validated: false,
            },
          },
        },
      },
    },
  });
};

export const getOrgInfo = async (orgId: number) => {
  const orgInfo = await prisma.organization.findUnique({
    where: {
      id: orgId,
    },
    select: {
      name: true,
      organizationAddress: true,
      Vehicle: {
        where: {
          status: VehicleStatus.VALIDATED,
          isActive: true,
        },
        select: {
          make: true,
        },
      },
    },
  });
  if (!orgInfo) {
    throw new Error("Organization not found!");
  }
  const makes: Set<string> = new Set();
  for (const vehicle of orgInfo.Vehicle) {
    makes.add(vehicle.make);
  }
  let serviceAddress: string = "";
  let recordsAddress: string = "";
  for (const address of orgInfo.organizationAddress) {
    const addressType = address.addressType;
    const addressString = `${address.addressLines}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`;
    if (addressType === AddressType.SERVICE) {
      serviceAddress = addressString;
    } else if (addressType === AddressType.RECORDS) {
      recordsAddress = addressString;
    }
  }
  return {
    name: orgInfo.name,
    makes: Array.from(makes).join(", "),
    serviceAddress,
    recordsAddress,
  };
};

export const getReservedVins = async (vins: string[]) => {
  const where = {
    vin: {
      in: vins,
    },
  };
  const select = {
    vin: true,
  };
  const records = await prisma.reservedVin.findMany({
    where,
    select,
  });
  return records.reduce((acc: string[], cv) => {
    return [...acc, cv.vin];
  }, []);
};

export const getEligibleVehicles = async (
  orgId: number,
  includeAdditionalFields: boolean,
) => {
  return await prisma.vehicle.findMany({
    where: {
      organizationId: orgId,
      status: VehicleStatus.VALIDATED,
      isActive: true,
    },
    select: {
      make: true,
      modelName: true,
      modelYear: true,
      id: includeAdditionalFields,
      vehicleClass: includeAdditionalFields,
      zevClass: includeAdditionalFields,
      legacyNumberOfUnits: includeAdditionalFields,
      numberOfUnits: includeAdditionalFields,
      zevType: includeAdditionalFields,
      range: includeAdditionalFields,
    },
  });
};

export const getEligibleVehiclesMap = async (orgId: number) => {
  const result: ZevModelsMap = {};
  const vehicles = await getEligibleVehicles(orgId, true);
  for (const vehicle of vehicles) {
    const make = vehicle.make;
    const modelName = vehicle.modelName;
    const modelYear = vehicle.modelYear;
    const zevModelKey = getZevModelKey(make, modelName, modelYear);
    if (result[zevModelKey]) {
      throw new Error("Duplicate system vehicles found!");
    }
    result[zevModelKey] = {
      id: vehicle.id,
      vehicleClass: vehicle.vehicleClass,
      zevClass: vehicle.zevClass,
      legacyNumberOfUnits: vehicle.legacyNumberOfUnits.toFixed(2),
      numberOfUnits: vehicle.numberOfUnits.toFixed(2),
      zevType: vehicle.zevType,
      range: vehicle.range,
    };
  }
  return result;
};

export type IcbcRecordsMap = Partial<
  Record<
    string,
    {
      make: string;
      modelName: string;
      modelYear: ModelYear;
      registrationDate?: Date;
    }
  >
>;

export const getIcbcRecordsMap = async (
  vins: string[],
): Promise<IcbcRecordsMap> => {
  const result: IcbcRecordsMap = {};
  const cthubUrl = process.env.CTHUB_URL;
  const cthubToken = process.env.CTHUB_TOKEN;
  if (cthubUrl && cthubToken) {
    const response = await axios.post(
      `${cthubUrl}/icbc/get_icbc_ev_records`,
      { vins },
      { headers: { Authorization: `Token ${cthubToken}` } },
    );
    const data: Record<
      string,
      {
        make: string | null;
        model: string | null;
        modelYear: string | null;
        registrationDate: string | null;
      }
    > = response.data;
    const modelYearsMap = getStringsToModelYearsEnumsMap();
    for (const [vin, record] of Object.entries(data)) {
      const make = record.make;
      const modelName = record.model;
      const modelYearString = record.modelYear;
      const registrationDate = record.registrationDate;
      if (make && modelName && modelYearString) {
        const modelYear = modelYearsMap[modelYearString];
        if (modelYear) {
          result[vin] = { make, modelName, modelYear };
          if (registrationDate) {
            const [dateIsValid, ts] = validateDate(registrationDate);
            if (dateIsValid) {
              result[vin].registrationDate = ts;
            }
          }
        }
      }
    }
  }
  return result;
};

export type DecodedVinsMap = Partial<
  Record<
    string,
    {
      make: string;
      modelName: string;
      modelYear: ModelYear;
    }
  >
>;

export const getDecodedVinsMap = async (
  vins: string[],
): Promise<DecodedVinsMap> => {
  const result: DecodedVinsMap = {};
  const cthubUrl = process.env.CTHUB_URL;
  const cthubToken = process.env.CTHUB_TOKEN;
  if (cthubUrl && cthubToken) {
    const response = await axios.post(
      `${cthubUrl}/decoded-vin-records/get_vinpower_decoded_ev_vins`,
      { vins },
      { headers: { Authorization: `Token ${cthubToken}` } },
    );
    const data: Record<
      string,
      {
        make: string | null;
        model: string | null;
        modelYear: string | null;
      }
    > = response.data;
    const modelYearsMap = getStringsToModelYearsEnumsMap();
    for (const [vin, record] of Object.entries(data)) {
      const make = record.make;
      const modelName = record.model;
      const modelYearString = record.modelYear;
      if (make && modelName && modelYearString) {
        const modelYear = modelYearsMap[modelYearString];
        if (modelYear) {
          result[vin] = { make, modelName, modelYear };
        }
      }
    }
  }
  return result;
};

export const createHistory = async (
  userId: number,
  creditApplicationId: number,
  userAction: CreditApplicationStatus,
  comment?: string,
  transactionClient?: TransactionClient,
): Promise<number> => {
  const prismaClient = transactionClient ?? prisma;
  const { id } = await prismaClient.creditApplicationHistory.create({
    data: {
      userId,
      creditApplicationId,
      userAction,
      comment,
    },
  });
  return id;
};

export const updateStatus = async (
  creditApplicationId: number,
  status: CreditApplicationStatus,
  transactionClient?: TransactionClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.creditApplication.update({
    where: {
      id: creditApplicationId,
    },
    data: {
      status: status,
      supplierStatus: mapOfStatusToSupplierStatus[status],
    },
  });
};

export const unreserveVins = async (
  vins: string[],
  transactionClient?: TransactionClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.reservedVin.deleteMany({
    where: {
      vin: {
        in: vins,
      },
    },
  });
};

export const createAttachments = async (
  creditApplicationId: number,
  attachments: Attachment[],
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  const toCreate = [];
  for (const attachment of attachments) {
    toCreate.push({
      creditApplicationId,
      objectName: attachment.objectName,
      fileName: attachment.fileName,
    });
  }
  await client.creditApplicationAttachment.createMany({
    data: toCreate,
  });
};

export const deleteAttachments = async (
  creditApplicationId: number,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.creditApplicationAttachment.deleteMany({
    where: {
      creditApplicationId,
    },
  });
};

export const getAnalystComments = async (
  creditApplicationId: number,
): Promise<ChatComment[]> => {
  const result: ChatComment[] = [];
  const comments = await prisma.creditApplicationAnalystComment.findMany({
    where: {
      creditApplicationId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
  for (const comment of comments) {
    result.push({
      id: comment.id,
      userId: comment.userId,
      name: `${comment.user.firstName} ${comment.user.lastName}`,
      comment: comment.comment,
      timestamp: `${getIsoYmdString(comment.timestamp)} ${getTimeWithTz(comment.timestamp)}`,
    });
  }
  return result;
};

export const getCaGlobalData = async (
  caId: number,
  attemptedSubmissionDate: Date,
  orgId: number,
): Promise<{ complianceYear: ModelYear; isSupplementary: boolean }> => {
  if (within20DayPeriod(attemptedSubmissionDate)) {
    const subDatePrevCy = getPreviousComplianceYear(attemptedSubmissionDate);
    const subDatePrevCyCd = getComplianceDate(subDatePrevCy);
    const [recordsDateIndicator, { mysWithRecordsOnOrBeforeCd }, myrStatus] =
      await Promise.all([
        getCaRecordsDateIndicator(caId, subDatePrevCyCd),
        getCaMyCdData(caId),
        getMyrStatus(subDatePrevCy, orgId),
      ]);
    if (
      !recordsDateIndicator.hasRecordsAfterDate &&
      mysWithRecordsOnOrBeforeCd.every((my) => subDatePrevCy <= my) &&
      !myrStatus
    ) {
      return {
        complianceYear: subDatePrevCy,
        isSupplementary: false,
      };
    }
  } else {
    const subDateCy = getComplianceYear(attemptedSubmissionDate);
    const { mysWithRecordsOnOrBeforeCd, mysWithRecordsAfterCd } =
      await getCaMyCdData(caId);
    if (
      mysWithRecordsAfterCd.length === 0 &&
      mysWithRecordsOnOrBeforeCd.length === 1
    ) {
      const potentialCy = mysWithRecordsOnOrBeforeCd[0];
      if (potentialCy < subDateCy) {
        const myrStatus = await getMyrStatus(potentialCy, orgId);
        if (myrStatus === ModelYearReportStatus.ASSESSED) {
          return {
            complianceYear: potentialCy,
            isSupplementary: true,
          };
        }
      }
    }
    if (mysWithRecordsOnOrBeforeCd.every((my) => subDateCy <= my)) {
      const myrStatus = await getMyrStatus(subDateCy, orgId);
      if (!myrStatus) {
        return {
          complianceYear: subDateCy,
          isSupplementary: false,
        };
      }
    }
  }
  throw new ImpermissableCaSubmission();
};

export const getCaRecordsDateIndicator = async (caId: number, date: Date) => {
  let hasRecordsOnOrBeforeDate = false;
  let hasRecordsAfterDate = false;
  const caRecords = await prisma.creditApplicationRecord.findMany({
    where: {
      creditApplicationId: caId,
    },
    select: {
      timestamp: true,
    },
  });
  for (const record of caRecords) {
    if (record.timestamp <= date) {
      hasRecordsOnOrBeforeDate = true;
    } else {
      hasRecordsAfterDate = true;
    }
  }
  return {
    hasRecordsOnOrBeforeDate,
    hasRecordsAfterDate,
  };
};

export const getCaMyCdData = async (caId: number) => {
  const mysWithRecordsOnOrBeforeCd = new Set<ModelYear>();
  const mysWithRecordsAfterCd = new Set<ModelYear>();
  const caRecords = await prisma.creditApplicationRecord.findMany({
    where: {
      creditApplicationId: caId,
    },
    select: {
      modelYear: true,
      timestamp: true,
    },
  });
  for (const record of caRecords) {
    const my = record.modelYear;
    const complianceDate = getComplianceDate(my);
    if (record.timestamp <= complianceDate) {
      mysWithRecordsOnOrBeforeCd.add(my);
    } else {
      mysWithRecordsAfterCd.add(my);
    }
  }
  return {
    mysWithRecordsOnOrBeforeCd: [...mysWithRecordsOnOrBeforeCd],
    mysWithRecordsAfterCd: [...mysWithRecordsAfterCd],
  };
};

export const getMyrStatus = async (my: ModelYear, orgId: number) => {
  const [myr, legacyMyr] = await Promise.all([
    prisma.modelYearReport.findUnique({
      where: {
        organizationId_modelYear: {
          organizationId: orgId,
          modelYear: my,
        },
      },
      select: {
        status: true,
      },
    }),
    prisma.legacyAssessedModelYearReport.findUnique({
      where: {
        organizationId_modelYear: {
          organizationId: orgId,
          modelYear: my,
        },
      },
    }),
  ]);
  if (myr && legacyMyr) {
    throw new Error("Unexpected Error!");
  }
  if (myr) {
    return myr.status;
  }
  if (legacyMyr) {
    return ModelYearReportStatus.ASSESSED;
  }
  return null;
};

export const getApplicationStatisticsSupplier = async (
  creditApplicationId: number,
  orgId: number,
): Promise<{
  type: "claimed" | "issued";
  vinsStatRecords: ReturnType<typeof getSupplierVinStatRecords>;
  creditsStatRecords: ReturnType<typeof getSupplierCreditStatRecords>;
}> => {
  const vinsStats: Record<string, number> = {};
  const creditsStats: Record<string, Decimal> = {};
  const ca = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
      organizationId: orgId,
    },
    select: {
      status: true,
      CreditApplicationRecord: {
        select: {
          vehicleClass: true,
          zevClass: true,
          modelYear: true,
          make: true,
          modelName: true,
          zevType: true,
          range: true,
          numberOfUnits: true,
          legacyNumberOfUnits: true,
          timestamp: true,
          validated: true,
        },
      },
    },
  });
  if (!ca) {
    return {
      type: "claimed",
      vinsStatRecords: [],
      creditsStatRecords: [],
    };
  }
  const records = ca.CreditApplicationRecord;
  const isIssued = ca.status === CreditApplicationStatus.ISSUED;
  let transactions: Omit<ZevUnitRecord, "type">[] = [];
  if (isIssued) {
    transactions = await prisma.zevUnitTransaction.findMany({
      where: {
        organizationId: orgId,
        referenceType: ReferenceType.SUPPLY_CREDITS,
        referenceId: creditApplicationId,
      },
      select: {
        vehicleClass: true,
        zevClass: true,
        modelYear: true,
        numberOfUnits: true,
      },
    });
  }
  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  for (const record of records) {
    if ((isIssued && record.validated) || !isIssued) {
      const key = getStatsKey(
        vehicleClassMap[record.vehicleClass] ?? "",
        zevClassMap[record.zevClass] ?? "",
        modelYearsMap[record.modelYear] ?? "",
        record.make,
        record.modelName,
        record.zevType,
        record.range.toString(),
        record.legacyNumberOfUnits.toString(),
        record.numberOfUnits.toString(),
      );
      if (!vinsStats[key]) {
        vinsStats[key] = 1;
      } else {
        vinsStats[key] = vinsStats[key] + 1;
      }
    }
  }
  if (isIssued) {
    for (const transaction of transactions) {
      const numberOfUnits = transaction.numberOfUnits;
      const key = getSupplierCreditStatsKey(
        vehicleClassMap[transaction.vehicleClass] ?? "",
        zevClassMap[transaction.zevClass] ?? "",
        modelYearsMap[transaction.modelYear] ?? "",
      );
      if (!creditsStats[key]) {
        creditsStats[key] = numberOfUnits;
      } else {
        creditsStats[key] = creditsStats[key].plus(numberOfUnits);
      }
    }
  } else {
    const modelYearsMap = getModelYearEnumsToStringsMap();
    for (const record of records) {
      let numberOfUnitsToUse;
      const onOrBeforeCd = getCaRecordOnOrBeforeCd(record, modelYearsMap);
      if (onOrBeforeCd && record.modelYear < ModelYear.MY_2026) {
        numberOfUnitsToUse = record.legacyNumberOfUnits;
      } else {
        numberOfUnitsToUse = record.numberOfUnits;
      }
      const key = getSupplierCreditStatsKey(
        vehicleClassMap[record.vehicleClass] ?? "",
        zevClassMap[record.zevClass] ?? "",
        modelYearsMap[record.modelYear] ?? "",
      );
      if (!creditsStats[key]) {
        creditsStats[key] = numberOfUnitsToUse;
      } else {
        creditsStats[key] = creditsStats[key].plus(numberOfUnitsToUse);
      }
    }
  }
  return {
    type: isIssued ? "issued" : "claimed",
    vinsStatRecords: getSupplierVinStatRecords(vinsStats),
    creditsStatRecords: getSupplierCreditStatRecords(creditsStats),
  };
};

export const getApplicationStatisticsGov = async (
  creditApplicationId: number,
  date: Date,
): Promise<GovCaStatRecord[]> => {
  const stats: Record<
    string,
    {
      vinsCount: number;
      validVinsCount: number;
      creditsSum: Decimal;
      validCreditsSum: Decimal;
    }
  > = {};
  const ca = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
    },
    select: {
      complianceYear: true,
      CreditApplicationRecord: {
        select: {
          make: true,
          modelName: true,
          modelYear: true,
          vehicleClass: true,
          zevClass: true,
          zevType: true,
          range: true,
          legacyNumberOfUnits: true,
          numberOfUnits: true,
          icbcRegistrationTimestamp: true,
          validated: true,
        },
      },
    },
  });
  if (!ca || !ca.complianceYear) {
    return [];
  }
  const complianceYear = ca.complianceYear;
  const { complianceDate, dayAfterComplianceDate } =
    getComplianceYearData(complianceYear);
  const records = ca.CreditApplicationRecord;
  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  for (const record of records) {
    const validated = record.validated;
    const key = getStatsKey(
      vehicleClassMap[record.vehicleClass] ?? "",
      zevClassMap[record.zevClass] ?? "",
      modelYearsMap[record.modelYear] ?? "",
      record.make,
      record.modelName,
      record.zevType,
      record.range.toString(),
      record.legacyNumberOfUnits.toString(),
      record.numberOfUnits.toString(),
    );
    if (!stats[key]) {
      stats[key] = {
        vinsCount: 0,
        validVinsCount: 0,
        creditsSum: new Decimal(0),
        validCreditsSum: new Decimal(0),
      };
    }
    stats[key].vinsCount = stats[key].vinsCount + 1;
    if (validated) {
      stats[key].validVinsCount = stats[key].validVinsCount + 1;
    }
    const { numberOfUnitsToUse } = getCaRecordData(
      complianceYear,
      complianceDate,
      dayAfterComplianceDate,
      record.icbcRegistrationTimestamp,
      date,
      record.legacyNumberOfUnits,
      record.numberOfUnits,
    );
    stats[key].creditsSum = stats[key].creditsSum.plus(numberOfUnitsToUse);
    if (validated) {
      stats[key].validCreditsSum =
        stats[key].validCreditsSum.plus(numberOfUnitsToUse);
    }
  }
  return getGovStatRecords(stats);
};

export const getCaTransactions = async (
  creditApplicationId: number,
  date: Date,
) => {
  const ca = await prisma.creditApplication.findUnique({
    where: {
      id: creditApplicationId,
    },
    select: {
      complianceYear: true,
      CreditApplicationRecord: {
        select: {
          vehicleClass: true,
          zevClass: true,
          modelYear: true,
          legacyNumberOfUnits: true,
          numberOfUnits: true,
          icbcRegistrationTimestamp: true,
          validated: true,
        },
      },
    },
  });
  if (!ca || !ca.complianceYear) {
    return {
      transactions: [],
      timestamps: [],
    };
  }
  const transactionsMap: Record<string, Decimal> = {};
  const complianceYear = ca.complianceYear;
  const { complianceDate, dayAfterComplianceDate } =
    getComplianceYearData(complianceYear);
  for (const record of ca.CreditApplicationRecord) {
    const { transactionDate, numberOfUnitsToUse } = getCaRecordData(
      complianceYear,
      complianceDate,
      dayAfterComplianceDate,
      record.icbcRegistrationTimestamp,
      date,
      record.legacyNumberOfUnits,
      record.numberOfUnits,
    );
    const key = getTransactionKey(
      record.vehicleClass,
      record.zevClass,
      record.modelYear,
      transactionDate,
    );
    if (!transactionsMap[key]) {
      transactionsMap[key] = numberOfUnitsToUse;
    } else {
      transactionsMap[key] = transactionsMap[key].plus(numberOfUnitsToUse);
    }
  }
  return getTransactionsAndTimestamps(transactionsMap);
};
