import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";
import { Role } from "@/prisma/generated/client";
import { createOrganization } from "../action";
import { AddressType } from "@/prisma/generated/client";
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

describe("Organization Action: createOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns undefined if user is not gov", async () => {
    mockFunctions({
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.ADMINISTRATOR], // test for non-gov user even with ADMINISTRATOR role
      }
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
      }
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
      orgWithId: { ...baseOrganization, id: 1 },
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
      data: baseOrganization
    });
    expect(createAddressFn).toHaveBeenCalledTimes(2);
    expect(createAddressFn).toHaveBeenNthCalledWith(1, {
      data: {
        ...baseAddress1,
        organizationId: 1,
        addressType: AddressType.SERVICE,
      }
    });
    expect(createAddressFn).toHaveBeenNthCalledWith(2, {
      data: {
        ...baseAddress2,
        organizationId: 1,
        addressType: AddressType.RECORDS,
      }
    });
    expect(result).toEqual({
      ...createdOrg,
      serviceAddress: createdServiceAddress,
      recordsAddress: createdRecordsAddress,
    });
  });


  it("creates organization but not empty addresses", async () => {
    const {
      createdOrg,
      createOrgFn,
      createAddressFn,
    } = mockFunctions({
      orgWithId: { ...baseOrganization, id: 1 },
      serviceAddressWithId: { ...emptyAddress, id: 10 },
      recordsAddressWithId: { ...emptyAddress, id: 11 },
    });

    const result = await createOrganization({
      ...baseOrganization,
      serviceAddress: emptyAddress,
      recordsAddress: emptyAddress,
    });

    expect(createOrgFn).toHaveBeenCalledWith({
      data: baseOrganization
    });
    expect(createOrgFn).toHaveBeenCalledTimes(1);
    expect(createAddressFn).not.toHaveBeenCalled();
    expect(result).toEqual({
      ...createdOrg,
      serviceAddress: undefined,
      recordsAddress: undefined,
    });
  });


  it("creates organization but not undefined addresses", async () => {
    const {
      createdOrg,
      createOrgFn,
      createAddressFn,
    } = mockFunctions({
      orgWithId: { ...baseOrganization, id: 1 },
      serviceAddressWithId: { ...emptyAddress, id: 10 },
      recordsAddressWithId: { ...emptyAddress, id: 11 },
    });

    const result = await createOrganization({
      ...baseOrganization,
      serviceAddress: undefined,
      recordsAddress: undefined,
    });

    expect(createOrgFn).toHaveBeenCalledWith({
      data: baseOrganization
    });
    expect(createOrgFn).toHaveBeenCalledTimes(1);
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
