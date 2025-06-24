import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Role } from "@/prisma/generated/client";
import { saveOrganization } from "../action";
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
  mockFunctionsWithError
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
const mockedDate = new Date("2025-03-09T02:15:00.000Z");
const mockDate = () => {
  global.Date = class extends Date {
    constructor() {
      super();
      return mockedDate;
    }
  } as DateConstructor;
};

describe("Organization Action: saveOrganization", () => {
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
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.ADMINISTRATOR], // test for non-gov user even with ADMINISTRATOR role
      }
    });
    const result = await saveOrganization(1, baseOrganization);
    expect(result).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });


  it("returns undefined if user is not ADMINISTRATOR", async () => {
    mockFunctions({
      userInfo: {
        ...baseNonGovUserInfo,
        userRoles: [Role.DIRECTOR], // Not an ADMINISTRATOR
      }
    });
    const result = await saveOrganization(1, baseOrganization);
    expect(result).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });


  it("updates organization and creates new addresses", async () => {
    const testOrgId = 2;
    const {
      updateOrgFn,
      createAddressFn,
      findManyAddressFn,
      updateManyAddressFn,
    } = mockFunctions({
      userInfo: baseGovUserInfo,
      orgWithId: { id: testOrgId, ...baseOrganization },
      serviceAddressWithId: { id: 10, ...baseAddress1 },
      recordsAddressWithId: { id: 11, ...baseAddress2 },
      existingAddressIds: {
        service: [],
        records: [],
      },
    });

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
      }
    });

    // Expect that tx.organizationAddress.findMany was called twice, once for each address type
    expect(findManyAddressFn).toHaveBeenCalledTimes(2);

    // Expect that the existing service and records addresses were updated with the mocked date
    expect(updateManyAddressFn).toHaveBeenCalledTimes(2);
    expect(updateManyAddressFn).toHaveBeenNthCalledWith(1, {
      where: {
        organizationId: testOrgId,
        addressType: AddressType.SERVICE,
        expirationDate: null,
      },
      data: {
        expirationDate: mockedDate,
      }
    });
    expect(updateManyAddressFn).toHaveBeenNthCalledWith(2, {
      where: {
        organizationId: testOrgId,
        addressType: AddressType.RECORDS,
        expirationDate: null,
      },
      data: {
        expirationDate: mockedDate,
      }
    });

    // Expect that new addresses were created
    expect(createAddressFn).toHaveBeenCalledTimes(2);
    expect(createAddressFn).toHaveBeenNthCalledWith(1, {
      data: {
        ...baseAddress1,
        organizationId: testOrgId,
        addressType: AddressType.SERVICE,
      },
    });
    expect(createAddressFn).toHaveBeenNthCalledWith(2, {
      data: {
        ...baseAddress2,
        organizationId: testOrgId,
        addressType: AddressType.RECORDS,
      },
    });
    
    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });


  it("updates organization without re-creating existing addresses", async () => {
    const testOrgId = 2;
    const {
      updateOrgFn,
      createAddressFn,
      findManyAddressFn,
      updateManyAddressFn,
    } = mockFunctions({
      userInfo: baseGovUserInfo,
      orgWithId: { id: testOrgId, ...baseOrganization },
      existingAddressIds: {
        service: [3, 4], // Existing service addresses
        records: [5], // Existing records address
      },
    });

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
      }
    });

    // Expect that tx.organizationAddress.findMany was called twice, once for each address type
    expect(findManyAddressFn).toHaveBeenCalledTimes(2);

    // Expect that the existing service and records addresses were not updated
    expect(updateManyAddressFn).not.toHaveBeenCalled();

    // Expect that new addresses were not created
    expect(createAddressFn).not.toHaveBeenCalled();
    
    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });


  it("updates organization with existing addresses expired", async () => {
    const testOrgId = 2;
    const {
      updateOrgFn,
      createAddressFn,
      findManyAddressFn,
      updateManyAddressFn,
    } = mockFunctions({
      userInfo: baseGovUserInfo,
      orgWithId: { id: testOrgId, ...baseOrganization },
      existingAddressIds: {
        service: [],
        records: [],
      },
    });

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
      }
    });

    // Expect that tx.organizationAddress.findMany was called twice, once for each address type
    expect(findManyAddressFn).toHaveBeenCalledTimes(2);

    // Expect that the existing service and records addresses were updated with the mocked date
    expect(updateManyAddressFn).toHaveBeenCalledTimes(2);
    expect(updateManyAddressFn).toHaveBeenNthCalledWith(1, {
      where: {
        organizationId: testOrgId,
        addressType: AddressType.SERVICE,
        expirationDate: null,
      },
      data: {
        expirationDate: mockedDate,
      }
    });
    expect(updateManyAddressFn).toHaveBeenNthCalledWith(2, {
      where: {
        organizationId: testOrgId,
        addressType: AddressType.RECORDS,
        expirationDate: null,
      },
      data: {
        expirationDate: mockedDate,
      }
    });

    // Expect that new addresses were not created
    expect(createAddressFn).not.toHaveBeenCalled();
    
    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });


  it("updates organization with one address updated", async () => {
    const testOrgId = 2;
    const {
      updateOrgFn,
      createAddressFn,
      findManyAddressFn,
      updateManyAddressFn,
    } = mockFunctions({
      userInfo: baseGovUserInfo,
      orgWithId: { id: testOrgId, ...baseOrganization },
      serviceAddressWithId: { id: 10, ...baseAddress1 },
      recordsAddressWithId: { id: 11, ...baseAddress2 },
      existingAddressIds: {
        service: [],
        records: [9],  // Existing records address
      },
    });

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
      }
    });

    // Expect that tx.organizationAddress.findMany was called twice, once for each address type
    expect(findManyAddressFn).toHaveBeenCalledTimes(2);

    // Expect that the existing service and records addresses were updated with the mocked date
    expect(updateManyAddressFn).toHaveBeenCalledTimes(1);
    expect(updateManyAddressFn).toHaveBeenNthCalledWith(1, {
      where: {
        organizationId: testOrgId,
        addressType: AddressType.SERVICE,
        expirationDate: null,
      },
      data: {
        expirationDate: mockedDate,
      }
    });

    // Expect that new addresses were created
    expect(createAddressFn).toHaveBeenCalledTimes(1);
    expect(createAddressFn).toHaveBeenNthCalledWith(1, {
      data: {
        ...baseAddress1,
        organizationId: testOrgId,
        addressType: AddressType.SERVICE,
      },
    });

    // Expect the result to be true
    expect(result).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });


  it("returns undefined and logs error if transaction fails", async () => {
    const { consoleSpy } = mockFunctionsWithError("Operation failed");
    const result = await saveOrganization(2, {
      ...baseOrganization,
      serviceAddress: baseAddress1,
      recordsAddress: baseAddress2,
    });
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
