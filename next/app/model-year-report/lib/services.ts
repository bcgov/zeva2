import { SupplierClass } from "@/app/lib/constants/complianceRatio";
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { prisma } from "@/lib/prisma";
import { modelYearEnumToInt } from "@/lib/utils/convertEnums";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  AddressType,
  ModelYear,
  OrganizationAddress,
  VehicleClass,
  ZevUnitTransaction,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import {
  validatePrevBalanceTransactions,
  getZevUnitRecordsOrderByClause,
} from "./utils";

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
  if (modelYear < ModelYear.MY_2024) {
    throw new Error("Model year must be at least 2024!");
  }
  const modelYearsArray = Object.values(ModelYear);
  const myIndex = modelYearsArray.findIndex((my) => my === modelYear);
  const precedingMys: ModelYear[] = [];
  for (let i = 1; i <= 3; i++) {
    const precedingMy = modelYearsArray[myIndex - i];
    precedingMys.push(precedingMy);
  }
  const volumes = await prisma.supplyVolume.findMany({
    where: {
      OR: [
        { modelYear: precedingMys[0] },
        { modelYear: precedingMys[1] },
        { modelYear: precedingMys[2] },
      ],
      organizationId,
      vehicleClass: VehicleClass.REPORTABLE,
    },
  });
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
  const prevEndingBalance = await prisma.zevUnitEndingBalance.findFirst({
    select: {
      complianceYear: true,
    },
    where: {
      organizationId,
    },
    orderBy: {
      complianceYear: "desc",
    },
  });
  const { closedLowerBound: currentCyLb } = getCompliancePeriod(
    modelYearEnumToInt(complianceYear),
  );
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
    return validatePrevBalanceTransactions(transactions);
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
  const { openUpperBound: prevCyUb } = getCompliancePeriod(
    modelYearEnumToInt(prevCy),
  );
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
  result.push(...validatePrevBalanceTransactions(transactions));
  return result;
};

export type MyrZevUnitTransaction = Omit<
  ZevUnitTransaction,
  "id" | "organizationId" | "timestamp"
>;

export const getTransactionsForModelYear = async (
  organizationId: number,
  modelYear: ModelYear,
): Promise<MyrZevUnitTransaction[]> => {
  const modelYearInt = modelYearEnumToInt(modelYear);
  const { closedLowerBound, openUpperBound } =
    getCompliancePeriod(modelYearInt);
  return await prisma.zevUnitTransaction.findMany({
    where: {
      organizationId,
      timestamp: {
        gte: closedLowerBound,
        lt: openUpperBound,
      },
    },
    omit: {
      id: true,
      organizationId: true,
      timestamp: true,
    },
    orderBy: getZevUnitRecordsOrderByClause(),
  });
};
