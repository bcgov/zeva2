import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AgreementUserAction } from "@/prisma/generated/client";
import { addComment } from "../action";
import { prisma } from "@/lib/prisma";
import {
  baseGovUserInfo,
  baseNonGovUserInfo,
  mockFunctions,
  mockFunctionsWithError,
} from "./__test-utilities__/action-test-data";

jest.mock("@/auth", () => ({
  getUserInfo: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    agreementHistory: { create: jest.fn()},
  },
}));

// Define test data
const agreementId = 12;
const testComment = "This is a test comment.";
const createdHistoryComment = {
  id: 101,
  agreementId,
  userId: baseGovUserInfo.userId,
  timestamp: new Date("2025-09-15T16:20:00.000Z"),
  userAction: AgreementUserAction.ADDED_COMMENT_GOV_INTERNAL,
  agreementComment: {
    id: 99,
    comment: testComment,
  }
};

describe("Agreement action: addComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns null if user is not gov", async () => {
    mockFunctions({
      // test for non-gov user
      userInfo: baseNonGovUserInfo,
    });

    const result = await addComment(agreementId, testComment);

    expect(result).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("adds gov internal comment to the agreement", async () => {
    mockFunctions({
      userInfo: baseGovUserInfo,
    });
    const mockedHistoryCreate = jest.spyOn(prisma.agreementHistory, "create")
      .mockResolvedValue(createdHistoryComment);

    const result = await addComment(agreementId, testComment);
    expect(result).toBe(createdHistoryComment);
    mockedHistoryCreate.mockRestore();
  });

  it("returns null and logs error if transaction fails", async () => {
    const errorMessage = "Operation failed";
    const { consoleSpy } = mockFunctionsWithError(errorMessage);
    const mockedHistoryCreate = jest.spyOn(prisma.agreementHistory, "create")
      .mockRejectedValue(new Error(errorMessage));

    const result = await addComment(agreementId, testComment);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    mockedHistoryCreate.mockRestore();
  });
});
