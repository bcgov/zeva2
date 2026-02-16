import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { Role, AddressType } from "@/prisma/generated/enums";
import { createOrganization } from "../action";
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

const testOrgId = 1;

describe("Organization action: createOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns undefined if user is not gov", async () => {
    mockFunctions({
      // test for non-gov user even with ADMINISTRATOR role
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.ADMINISTRATOR],
      },
    });
    const result = await createOrganization(baseOrganization);
    expect(result).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns undefined if user is not ADMINISTRATOR", async () => {
    mockFunctions({
      userInfo: {
        ...baseGovUserInfo,
        userRoles: [Role.DIRECTOR], // Not an ADMINISTRATOR
      },
    });
    const result = await createOrganization(baseOrganization);
    expect(result).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates organization and addresses records", async () => {
    const {
      createdOrg,
      createdServiceAddress,
      createdRecordsAddress,
      createOrgFn,
      createAddressFn,
    } = mockFunctions({
      orgWithId: { ...baseOrganization, id: testOrgId },
      serviceAddressWithId: { ...baseAddress1, id: 10 },
      recordsAddressWithId: { ...baseAddress2, id: 11 },
    });

    const result = await createOrganization({
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: baseAddress2,
    });

    expect(createOrgFn).toHaveBeenCalledTimes(1);
    expect(createOrgFn).toHaveBeenCalledWith({
      data: baseOrganization,
    });
    assertCreatedAddresses(createAddressFn, testOrgId, [
      { addressType: AddressType.SERVICE, ...baseAddress1 },
      { addressType: AddressType.RECORDS, ...baseAddress2 },
    ]);
    expect(result).toEqual({
      ...createdOrg,
      serviceAddress: createdServiceAddress,
      recordsAddress: createdRecordsAddress,
    });
  });

  it("creates organization but not empty addresses", async () => {
    const { createdOrg, createOrgFn, createAddressFn } = mockFunctions({
      orgWithId: { ...baseOrganization, id: testOrgId },
      serviceAddressWithId: { ...emptyAddress, id: 10 },
      recordsAddressWithId: { ...emptyAddress, id: 11 },
    });

    const result = await createOrganization({
      ...baseOrganization,
      serviceAddress: emptyAddress,
      recordsAddress: emptyAddress,
    });

    expect(createOrgFn).toHaveBeenCalledTimes(1);
    expect(createOrgFn).toHaveBeenCalledWith({
      data: baseOrganization,
    });
    expect(createAddressFn).not.toHaveBeenCalled();
    expect(result).toEqual({
      ...createdOrg,
      serviceAddress: undefined,
      recordsAddress: undefined,
    });
  });

  it("creates organization but not undefined addresses", async () => {
    const { createdOrg, createOrgFn, createAddressFn } = mockFunctions({
      orgWithId: { ...baseOrganization, id: testOrgId },
      serviceAddressWithId: { ...emptyAddress, id: 10 },
      recordsAddressWithId: { ...emptyAddress, id: 11 },
    });

    const result = await createOrganization({
      ...baseOrganization,
      serviceAddress: undefined,
      recordsAddress: undefined,
    });

    expect(createOrgFn).toHaveBeenCalledTimes(1);
    expect(createOrgFn).toHaveBeenCalledWith({
      data: baseOrganization,
    });
    expect(createAddressFn).not.toHaveBeenCalled();
    expect(result).toEqual({
      ...createdOrg,
      serviceAddress: undefined,
      recordsAddress: undefined,
    });
  });

  it("returns undefined and logs error if transaction fails", async () => {
    const { consoleSpy } = mockFunctionsWithError("Operation failed");
    const result = await createOrganization(baseOrganization);
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
