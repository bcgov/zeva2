import { AddressType, Role } from "@/prisma/generated/enums";
import {
  OrganizationModel,
  OrganizationAddressModel,
} from "@/prisma/generated/models";
import { OrganizationAddressSparse } from "../../data";
import { UserInfo } from "@/auth";
import { expect, jest } from "@jest/globals";
import { OrganizationPayload } from "../../action";
import { prisma } from "@/lib/prisma";

export const baseGovUserInfo = {
  userIsGov: true,
  userId: 3,
  userOrgId: 1,
  userRoles: [Role.ADMINISTRATOR],
  userOrgName: "BC Government",
  userIdToken: "",
};

export const baseNonGovUserInfo = {
  userIsGov: false,
  userId: 4,
  userOrgId: 2,
  userRoles: [],
  userOrgName: "Test Organization",
  userIdToken: "",
};

export const emptyAddress: OrganizationAddressSparse = {
  addressLines: " ",
  city: "",
  postalCode: "   ",
  country: "",
  state: null,
  county: "",
  representative: "",
};

export const baseAddress1: OrganizationAddressSparse = {
  addressLines: "123 Main St",
  city: "Vancouver",
  postalCode: "V1V1V1",
  country: "Canada",
  state: "BC",
  county: "Metro Vancouver",
  representative: "John Doe",
};

export const baseAddress2: OrganizationAddressSparse = {
  addressLines: "456 Main St",
  city: "Burnaby",
  postalCode: "V2V2V2",
  country: "Canada",
  state: "BC",
  county: "Metro Vancouver",
  representative: null,
};

export const baseOrganization = {
  name: "Test Organization",
  shortName: "Test",
  isActive: true,
  isGovernment: false,
};

export const mockGetUserInfo = (userInfo: UserInfo) => {
  jest.spyOn(require("@/auth"), "getUserInfo").mockResolvedValue(userInfo);
};

export const mockFunctions = (opt: {
  userInfo?: UserInfo;
  orgWithId?: { id: number } & OrganizationPayload;
  serviceAddressWithId?: { id: number } & OrganizationAddressSparse;
  recordsAddressWithId?: { id: number } & OrganizationAddressSparse;
  existingAddressIds?: {
    service: number[];
    records: number[];
  };
}) => {
  const {
    userInfo,
    orgWithId,
    serviceAddressWithId,
    recordsAddressWithId,
    existingAddressIds,
  } = opt;

  // Mock the getUserInfo function.
  mockGetUserInfo(userInfo ?? baseGovUserInfo);

  // Create mock data for organization and addresses.
  const createdOrg: Omit<OrganizationModel, "supplierClass"> | undefined =
    orgWithId
      ? {
          ...orgWithId,
        }
      : undefined;
  const createdServiceAddress: OrganizationAddressModel | undefined =
    serviceAddressWithId
      ? {
          ...serviceAddressWithId,
          addressType: AddressType.SERVICE,
          expirationDate: null,
          organizationId: orgWithId?.id ?? 1, // Use org ID or default to 1
        }
      : undefined;
  const createdRecordsAddress: OrganizationAddressModel | undefined =
    recordsAddressWithId
      ? {
          ...recordsAddressWithId,
          addressType: AddressType.RECORDS,
          expirationDate: null,
          organizationId: orgWithId?.id ?? 1, // Use org ID or default to 1
        }
      : undefined;

  // Mock prisma.$transaction to simulate database operations.
  const createOrgFn = jest.fn(() => Promise.resolve(createdOrg));
  const updateOrgFn = jest.fn(() => Promise.resolve(createdOrg));
  const createAddressFn = jest
    .fn()
    .mockImplementationOnce(() => Promise.resolve(createdServiceAddress))
    .mockImplementationOnce(() => Promise.resolve(createdRecordsAddress));
  const findManyAddressFn = jest.fn(
    (options: { where: { addressType: AddressType } }) => {
      switch (options.where.addressType) {
        case AddressType.SERVICE:
          return Promise.resolve(
            existingAddressIds?.service?.map((id) => ({ id })),
          );
        case AddressType.RECORDS:
          return Promise.resolve(
            existingAddressIds?.records?.map((id) => ({ id })),
          );
        default:
          return Promise.resolve([]);
      }
    },
  );
  const updateManyAddressFn = jest.fn();

  // Use jest.spyOn to mock prisma.$transaction
  jest.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) =>
    cb({
      organization: {
        create: createOrgFn,
        update: updateOrgFn,
      },
      organizationAddress: {
        create: createAddressFn,
        findMany: findManyAddressFn,
        updateMany: updateManyAddressFn,
      },
    }),
  );

  return {
    createdOrg,
    createdServiceAddress,
    createdRecordsAddress,
    createOrgFn,
    updateOrgFn,
    createAddressFn,
    findManyAddressFn,
    updateManyAddressFn,
  };
};

export const mockFunctionsWithError = (errorMessage: string) => {
  // Mock the getUserInfo function.
  mockGetUserInfo(baseGovUserInfo);

  // Mock prisma.$transaction to simulate database operations with error.
  const err = new Error(errorMessage);
  (prisma.$transaction as jest.Mock).mockImplementation(async (tx: any) =>
    tx({
      organization: {
        create: jest.fn(() => Promise.reject(err)),
        update: jest.fn(() => Promise.reject(err)),
      },
      organizationAddress: {
        create: jest.fn(() => Promise.reject(err)),
        findMany: jest.fn(() => Promise.reject(err)),
        updateMany: jest.fn(() => Promise.reject(err)),
      },
    }),
  );

  // Mock console.error to suppress error logs during tests
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  return {
    consoleSpy,
  };
};

export const assertCreatedAddresses = (
  createAddressFn: jest.Mock,
  organizationId: number,
  expectedAddresses: ({
    addressType: AddressType;
  } & OrganizationAddressSparse)[],
) => {
  expect(createAddressFn).toHaveBeenCalledTimes(expectedAddresses.length);
  expectedAddresses.forEach((address, index) => {
    expect(createAddressFn).toHaveBeenNthCalledWith(index + 1, {
      data: {
        ...address,
        organizationId,
      },
    });
  });
};
