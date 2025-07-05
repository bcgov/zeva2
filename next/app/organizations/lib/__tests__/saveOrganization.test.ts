import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Role, AddressType } from "@/prisma/generated/client";
import { saveOrganization } from "../action";
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
  assertCreatedAddresses,
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

const assertExpiringAddresses = (
  updateManyAddressFn: jest.Mock,
  addressTypes: AddressType[],
) => {
  expect(updateManyAddressFn).toHaveBeenCalledTimes(addressTypes.length);
  addressTypes.forEach((addressType, index) => {
    expect(updateManyAddressFn).toHaveBeenNthCalledWith(index + 1, {
      where: {
        organizationId: testOrgId,
        addressType,
        expirationDate: null,
      },
      data: {
        expirationDate: mockedDate,
      },
    });
  });
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

  it("returns false if user is not gov", async () => {
    mockFunctions({
      // test for non-gov user even with ADMINISTRATOR role
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.ADMINISTRATOR],
      },
    });
    const result = await saveOrganization(testOrgId, baseOrganization);
    expect(result).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns undefined if user is not ADMINISTRATOR", async () => {
    mockFunctions({
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.DIRECTOR], // Not an ADMINISTRATOR
      },
    });
    const result = await saveOrganization(testOrgId, baseOrganization);
    expect(result).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updates organization and creates new addresses", async () => {
    const { updateOrgFn, createAddressFn, updateManyAddressFn } = mockFunctions(
      {
        userInfo: baseGovUserInfo,
        orgWithId: { id: testOrgId, ...baseOrganization },
        serviceAddressWithId: { id: 10, ...baseAddress1 },
        recordsAddressWithId: { id: 11, ...baseAddress2 },
        existingAddressIds: {
          service: [],
          records: [],
        },
      },
    );

    const result = await saveOrganization(testOrgId, {
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: baseAddress2,
    });

    // Expect that organization was updated
    expect(updateOrgFn).toHaveBeenCalledTimes(1);
    expect(updateOrgFn).toHaveBeenCalledWith({
      where: { id: testOrgId },
      data: {
        ...baseOrganization,
      },
    });

    // Expect that the existing service and records addresses were updated with the mocked date
    assertExpiringAddresses(updateManyAddressFn, [
      AddressType.SERVICE,
      AddressType.RECORDS,
    ]);

    // Expect that new addresses were created
    assertCreatedAddresses(createAddressFn, testOrgId, [
      { addressType: AddressType.SERVICE, ...baseAddress1 },
      { addressType: AddressType.RECORDS, ...baseAddress2 },
    ]);

    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("updates organization without re-creating existing addresses", async () => {
    const { updateOrgFn, createAddressFn, updateManyAddressFn } = mockFunctions(
      {
        userInfo: baseGovUserInfo,
        orgWithId: { id: testOrgId, ...baseOrganization },
        existingAddressIds: {
          service: [3, 4], // Existing service addresses
          records: [5], // Existing records address
        },
      },
    );

    const result = await saveOrganization(testOrgId, {
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: baseAddress2,
    });

    // Expect that organization was updated
    expect(updateOrgFn).toHaveBeenCalledTimes(1);
    expect(updateOrgFn).toHaveBeenCalledWith({
      where: { id: testOrgId },
      data: {
        ...baseOrganization,
      },
    });

    // Expect that the existing service and records addresses were not updated
    expect(updateManyAddressFn).not.toHaveBeenCalled();

    // Expect that new addresses were not created
    expect(createAddressFn).not.toHaveBeenCalled();

    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("updates organization with existing addresses expired", async () => {
    const { updateOrgFn, createAddressFn, updateManyAddressFn } = mockFunctions(
      {
        userInfo: baseGovUserInfo,
        orgWithId: { id: testOrgId, ...baseOrganization },
        existingAddressIds: {
          service: [],
          records: [],
        },
      },
    );

    const result = await saveOrganization(testOrgId, {
      ...baseOrganization,
      serviceAddress: emptyAddress,
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

    // Expect that the existing service and records addresses were updated with the mocked date
    assertExpiringAddresses(updateManyAddressFn, [
      AddressType.SERVICE,
      AddressType.RECORDS,
    ]);

    // Expect that new addresses were not created
    expect(createAddressFn).not.toHaveBeenCalled();

    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("updates organization with one address updated", async () => {
    const { updateOrgFn, createAddressFn, updateManyAddressFn } = mockFunctions(
      {
        userInfo: baseGovUserInfo,
        orgWithId: { id: testOrgId, ...baseOrganization },
        serviceAddressWithId: { id: 10, ...baseAddress1 },
        recordsAddressWithId: { id: 11, ...baseAddress2 },
        existingAddressIds: {
          service: [],
          records: [9], // Existing records address
        },
      },
    );

    const result = await saveOrganization(testOrgId, {
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: baseAddress2,
    });

    // Expect that organization was updated
    expect(updateOrgFn).toHaveBeenCalledTimes(1);
    expect(updateOrgFn).toHaveBeenCalledWith({
      where: { id: testOrgId },
      data: {
        ...baseOrganization,
      },
    });

    // Expect that the existing service and records addresses were updated with the mocked date
    assertExpiringAddresses(updateManyAddressFn, [AddressType.SERVICE]);

    // Expect that new addresses were created
    assertCreatedAddresses(createAddressFn, testOrgId, [
      { addressType: AddressType.SERVICE, ...baseAddress1 },
    ]);

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
