import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { ModelYear, Role, ZevClass } from "@/prisma/generated/client";
import { AgreementContentPayload, saveAgreement } from "../action";
import { prisma } from "@/lib/prisma";
import {
  baseGovUserInfo,
  baseNonGovUserInfo,
  mockFunctions,
  mockFunctionsWithError,
  baseAgreement,
  baseAgreementContent,
  baseAttachments,
  mockDate,
} from "./__test-utilities__/action-test-data";

jest.mock("@/auth", () => ({
  getUserInfo: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

// Mock the Date constructor to control the current date
const originalDate = Date;
const mockedDate = new Date("2025-09-15T16:20:00.000Z");

// Helper function to assert agreement-related calls
const assertAgreement = (
  agreementId: number,
  userId: number,
  deleteManyAgreementContentFn: jest.Mock,
  createManyAgreementContentFn: jest.Mock,
  createManyAgreementAttachmentFn: jest.Mock,
  createAgreementHistoryFn: jest.Mock,
  expectedAgreementContent: AgreementContentPayload[],
  expectedAttachments: any[] = [],
) => {
  expect(deleteManyAgreementContentFn).toHaveBeenCalledTimes(1);
  expect(deleteManyAgreementContentFn).toHaveBeenCalledWith({
    where: { agreementId },
  });

  expect(createManyAgreementContentFn).toHaveBeenCalledTimes(1);
  expect(createManyAgreementContentFn).toHaveBeenCalledWith({
    data: expectedAgreementContent.map((content) => ({
      ...content,
      agreementId,
    })),
  });

  expect(createManyAgreementAttachmentFn).toHaveBeenCalledTimes(1);
  expect(createManyAgreementAttachmentFn).toHaveBeenCalledWith({
    data: expectedAttachments.map((attachment) => ({
      ...attachment,
      agreementId,
    })),
  });

  expect(createAgreementHistoryFn).toHaveBeenCalledTimes(1);
  expect(createAgreementHistoryFn).toHaveBeenCalledWith({
    data: {
      agreementId,
      userId,
      timestamp: mockedDate,
      userAction: "SAVED",
    },
  });
};

describe("Agreement action: saveAgreement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDate(mockedDate); // Mock the Date constructor to return a fixed date
  });

  afterEach(() => {
    global.Date = originalDate; // Restore the original Date constructor
    jest.restoreAllMocks(); // Restore all mocks
  });

  it("returns undefined if user is not gov", async () => {
    mockFunctions({
      // test for non-gov user
      userInfo: baseNonGovUserInfo,
    });
    const result = await saveAgreement(baseAgreement);
    expect(result).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns undefined if user is not ZEVA_IDIR_USER", async () => {
    mockFunctions({
      userInfo: {
        ...baseGovUserInfo,
        userRoles: [Role.DIRECTOR], // Not a ZEVA_IDIR_USER
      },
    });
    const result = await saveAgreement(baseAgreement);
    expect(result).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates new agreement record", async () => {
    const agreementId = 10;
    const {
      createdAgreement,
      createAgreementFn,
      deleteManyAgreementContentFn,
      createManyAgreementContentFn,
      createManyAgreementAttachmentFn,
      createAgreementHistoryFn,
    } = mockFunctions({
      agreementId,
      agreementData: baseAgreement,
      //agreementWithId: { id: agreementId, ...baseAgreement },
    });

    const agreementContent = [
      ...baseAgreementContent,
      // Add some entries that should be filtered out
      { zevClass: ZevClass.B, modelYear: ModelYear.MY_2022, numberOfUnits: 0 },
      { zevClass: ZevClass.A, modelYear: ModelYear.MY_2022, numberOfUnits: -5 },
    ];
    const result = await saveAgreement(
      { ...baseAgreement, agreementContent },
      [],
    );

    expect(createAgreementFn).toHaveBeenCalledTimes(1);
    expect(createAgreementFn).toHaveBeenCalledWith({
      data: { ...baseAgreement, agreementContent: undefined },
    });

    assertAgreement(
      agreementId,
      baseGovUserInfo.userId,
      deleteManyAgreementContentFn,
      createManyAgreementContentFn,
      createManyAgreementAttachmentFn,
      createAgreementHistoryFn,
      baseAgreementContent,
    );

    expect(result).toEqual(createdAgreement);
  });

  it("updates existing agreement record", async () => {
    const agreementId = 10;
    const {
      createdAgreement,
      updateAgreementFn,
      deleteManyAgreementContentFn,
      createManyAgreementContentFn,
      createManyAgreementAttachmentFn,
      createAgreementHistoryFn,
    } = mockFunctions({
      agreementId,
      agreementData: baseAgreement,
    });

    const result = await saveAgreement(
      baseAgreement,
      baseAttachments,
      agreementId,
    );

    expect(updateAgreementFn).toHaveBeenCalledTimes(1);
    expect(updateAgreementFn).toHaveBeenCalledWith({
      where: { id: agreementId },
      data: { ...baseAgreement, agreementContent: undefined },
    });

    assertAgreement(
      agreementId,
      baseGovUserInfo.userId,
      deleteManyAgreementContentFn,
      createManyAgreementContentFn,
      createManyAgreementAttachmentFn,
      createAgreementHistoryFn,
      baseAgreementContent,
      baseAttachments,
    );

    expect(result).toEqual(createdAgreement);
  });

  it("returns undefined and logs error if transaction fails", async () => {
    const { consoleSpy } = mockFunctionsWithError("Operation failed");

    // Mock remoteObject to avoid actual remote calls
    const removeObjectFn = jest.fn(() => Promise.resolve());
    jest
      .spyOn(require("@/app/lib/minio"), "removeObjects")
      .mockImplementation(removeObjectFn);

    const agreementId = 10;
    const result = await saveAgreement(
      baseAgreement,
      baseAttachments,
      agreementId,
    );
    expect(removeObjectFn).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
