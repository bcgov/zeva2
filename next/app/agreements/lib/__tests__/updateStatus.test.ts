import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AgreementStatus } from "@/prisma/generated/client";
import { updateStatus } from "../action";
import { prisma } from "@/lib/prisma";
import {
  baseGovUserInfo,
  baseNonGovUserInfo,
  mockFunctions,
  mockFunctionsWithError,
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

// Define test data
const agreementId = 9;
const newStatus = AgreementStatus.RECOMMEND_APPROVAL;

describe("Agreement action: updateStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDate(mockedDate); // Mock the Date constructor to return a fixed date
  });

  afterEach(() => {
    global.Date = originalDate; // Restore the original Date constructor
    jest.restoreAllMocks(); // Restore all mocks
  });

  it("returns false if user is not gov", async () => {
    mockFunctions({
      // test for non-gov user
      userInfo: baseNonGovUserInfo,
    });

    const result = await updateStatus(agreementId, newStatus);

    expect(result).toBeFalsy();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns false if change status to DRAFT", async () => {
    mockFunctions({
      userInfo: baseGovUserInfo,
    });

    const result = await updateStatus(agreementId, AgreementStatus.DRAFT);

    expect(result).toBeFalsy();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updates the agreement status", async () => {
    const {
      updateAgreementFn,
      createAgreementHistoryFn,
    } = mockFunctions({
      agreementId,
    });
    
    const result = await updateStatus(agreementId, newStatus);

    expect(updateAgreementFn).toHaveBeenCalledTimes(1);
    expect(updateAgreementFn).toHaveBeenCalledWith({
      where: { id: agreementId },
      data: { status: newStatus},
    });

    expect(createAgreementHistoryFn).toHaveBeenCalledTimes(1);
    expect(createAgreementHistoryFn).toHaveBeenCalledWith({
      data: {
        agreementId,
        userId: baseGovUserInfo.userId,
        timestamp: mockedDate,
        userAction: newStatus,
      },
    });

    expect(result).toBeTruthy();
  });

  it("returns false and logs error if transaction fails", async () => {
    const { consoleSpy } = mockFunctionsWithError("Operation failed");

    const result = await updateStatus(agreementId, newStatus);

    expect(result).toBeFalsy();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
