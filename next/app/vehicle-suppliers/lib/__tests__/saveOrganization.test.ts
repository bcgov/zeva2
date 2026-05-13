import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Role } from "@/prisma/generated/enums";
import { saveOrganization } from "../actions";
import { prisma } from "@/lib/prisma";
import {
  baseGovUserInfo,
  baseNonGovUserInfo,
  emptyAddress,
  baseAddress1,
  baseAddress2,
  baseOrganization,
  mockFunctions,
  mockFunctionsWithError,
} from "./__test-utilities__/action-test-data";

jest.mock("@/auth", () => ({
  getUserInfo: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

const testOrgId = 2;

// Mock the Date constructor to control the current date
const originalDate = Date;
const mockedDate = new Date("2025-03-09T02:15:00.000Z");
const mockDate = () => {
  global.Date = class extends Date {
    constructor() {
      super();
      return mockedDate;
    }
  } as DateConstructor;
};

describe("Organization action: saveOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDate(); // Mock the Date constructor to return a fixed date
  });

  afterEach(() => {
    global.Date = originalDate; // Restore the original Date constructor
    jest.restoreAllMocks(); // Restore all mocks
  });

  it("returns false if the user is a supplier user without the org admin role", async () => {
    mockFunctions({
      // test for non-gov user even with ADMINISTRATOR role
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.ZEVA_BCEID_USER],
      },
    });
    const result = await saveOrganization(testOrgId, baseOrganization);
    expect(result).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns false if the user is a gov user without the admin role", async () => {
    mockFunctions({
      userInfo: {
        ...baseGovUserInfo,
        userRoles: [Role.ZEVA_IDIR_USER],
      },
    });
    const result = await saveOrganization(testOrgId, baseOrganization);
    expect(result).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updates organization and upserts non-empty addresses", async () => {
    const { updateOrgFn, upsertAddressFn } = mockFunctions({
      userInfo: baseGovUserInfo,
      orgWithId: { id: testOrgId, ...baseOrganization },
    });

    const result = await saveOrganization(testOrgId, {
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: emptyAddress,
    });

    // Expect that organization was updated
    expect(updateOrgFn).toHaveBeenCalledTimes(1);
    expect(updateOrgFn).toHaveBeenCalledWith({
      where: { id: testOrgId },
      data: {
        ...baseOrganization,
      },
    });

    // Expect 1 addresses upserted
    expect(upsertAddressFn).toHaveBeenCalledTimes(1);

    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("returns undefined and logs error if transaction fails", async () => {
    const { consoleSpy } = mockFunctionsWithError("Operation failed");
    const result = await saveOrganization(testOrgId, {
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: baseAddress2,
    });
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
