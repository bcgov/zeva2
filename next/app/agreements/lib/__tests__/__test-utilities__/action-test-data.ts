import {
  Agreement,
  AgreementType,
  AgreementStatus,
  ZevClass,
  ModelYear,
  Role,
} from "@/prisma/generated/client";
import { UserInfo } from "@/auth";
import { jest } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { AgreementPayload } from "../../action";

export const baseGovUserInfo = {
  userIsGov: true,
  userId: 3,
  userOrgId: 1,
  userRoles: [Role.ZEVA_IDIR_USER],
  userOrgName: "BC Government",
  userIdToken: "",
};

export const baseNonGovUserInfo = {
  userIsGov: false,
  userId: 4,
  userOrgId: 2,
  userRoles: [Role.SIGNING_AUTHORITY],
  userOrgName: "Test Organization",
  userIdToken: "",
};

export const baseAgreementContent = [
  {
    zevClass: ZevClass.A,
    modelYear: ModelYear.MY_2025,
    numberOfUnits: 100,
  },
  {
    zevClass: ZevClass.B,
    modelYear: ModelYear.MY_2024,
    numberOfUnits: 50,
  },
];

export const baseAgreement: AgreementPayload = {
  organizationId: 1,
  referenceId: "AG-2025-0001",
  agreementType: AgreementType.INITIATIVE,
  status: AgreementStatus.DRAFT,
  effectiveDate: new Date(),
  comment: "Test comment to supplier.",
  agreementContent: baseAgreementContent,
};

export const baseAttachments = [
  {
    fileName: "attachment1.pdf",
    objectName: "attachments/attachment1.pdf",
  },
  {
    fileName: "attachment2.pdf",
    objectName: "attachments/attachment2.pdf",
  },
];

export const mockGetUserInfo = (userInfo: UserInfo) => {
  jest.spyOn(require("@/auth"), "getUserInfo").mockResolvedValue(userInfo);
};

export const mockFunctions = (opt: {
  userInfo?: UserInfo;
  agreementId?: number;
  agreementData?: AgreementPayload;
}) => {
  const { userInfo, agreementId, agreementData } = opt;

  // Mock the getUserInfo function.
  mockGetUserInfo(userInfo ?? baseGovUserInfo);

  // Create mock data for agreement.
  const createdAgreement: Agreement | undefined = agreementData
    ? { ...agreementData, id: agreementId ?? 1 }
    : undefined;

  // Mock prisma.$transaction to simulate database operations.
  const createAgreementFn = jest.fn(() => Promise.resolve(createdAgreement));
  const updateAgreementFn = jest.fn(() => Promise.resolve(createdAgreement));
  const deleteManyAgreementContentFn = jest.fn(() => Promise.resolve());
  const createManyAgreementContentFn = jest.fn(() => Promise.resolve());
  const createManyAgreementAttachmentFn = jest.fn(() => Promise.resolve());
  const createAgreementHistoryFn = jest.fn(() => Promise.resolve());

  // Use jest.spyOn to mock prisma.$transaction
  jest.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) =>
    cb({
      agreement: {
        create: createAgreementFn,
        update: updateAgreementFn,
      },
      agreementContent: {
        deleteMany: deleteManyAgreementContentFn,
        createMany: createManyAgreementContentFn,
      },
      agreementAttachment: {
        createMany: createManyAgreementAttachmentFn,
      },
      agreementHistory: {
        create: createAgreementHistoryFn,
      },
    }),
  );

  return {
    createdAgreement,
    createAgreementFn,
    updateAgreementFn,
    deleteManyAgreementContentFn,
    createManyAgreementContentFn,
    createManyAgreementAttachmentFn,
    createAgreementHistoryFn,
  };
};

export const mockFunctionsWithError = (errorMessage: string) => {
  // Mock the getUserInfo function.
  mockGetUserInfo(baseGovUserInfo);

  // Mock prisma.$transaction to simulate database operations with error.
  const err = new Error(errorMessage);
  jest.spyOn(prisma, "$transaction").mockImplementation(async (tx: any) =>
    //(prisma.$transaction as jest.Mock).mockImplementation(async (tx: any) =>
    tx({
      agreement: {
        create: jest.fn(() => Promise.reject(err)),
        update: jest.fn(() => Promise.reject(err)),
      },
      agreementContent: {
        deleteMany: jest.fn(() => Promise.reject(err)),
        createMany: jest.fn(() => Promise.reject(err)),
      },
      agreementAttachment: {
        createMany: jest.fn(() => Promise.reject(err)),
      },
      agreementHistory: {
        create: jest.fn(() => Promise.reject(err)),
      },
    }),
  );

  // Mock console.error to suppress error logs during tests
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  return {
    consoleSpy,
  };
};

export const mockDate = (mockedDate: Date) => {
  global.Date = class extends Date {
    constructor() {
      super();
      return mockedDate;
    }
  } as DateConstructor;
};
