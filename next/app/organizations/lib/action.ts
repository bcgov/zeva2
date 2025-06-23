import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AddressType,
  Organization,
  OrganizationAddress,
} from "@/prisma/generated/client";
import { isEmptyAddress } from "./utils";
import { OrganizationAddressSparse } from "./data";

export type OrganizationPayload = Omit<
  Organization,
  "id" | "firstModelYear"
> & {
  serviceAddress?: OrganizationAddressSparse;
  recordsAddress?: OrganizationAddressSparse;
};

/**
 * Create a new organization in the database.
 * @param data - The organization data to create.
 * @returns the created organization or undefined if no organization is created.
 */
export const createOrganization = async (data: OrganizationPayload) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes("ADMINISTRATOR")) {
    return undefined; // Only government users with ADMINISTRATOR role can create organizations
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          name: data.name,
          shortName: data.shortName,
          isActive: data.isActive,
          isGovernment: data.isGovernment,
        },
      });

      // Create service address if provided and not empty.
      let createdServiceAddress: OrganizationAddress | undefined;
      if (data.serviceAddress && !isEmptyAddress(data.serviceAddress)) {
        createdServiceAddress = await tx.organizationAddress.create({
          data: {
            ...data.serviceAddress,
            organizationId: createdOrganization.id,
            addressType: AddressType.SERVICE,
          },
        });
      }

      // Create records address if provided and not empty.
      let createdRecordsAddress: OrganizationAddress | undefined;
      if (data.recordsAddress && !isEmptyAddress(data.recordsAddress)) {
        createdRecordsAddress = await tx.organizationAddress.create({
          data: {
            ...data.recordsAddress,
            organizationId: createdOrganization.id,
            addressType: AddressType.RECORDS,
          },
        });
      }

      return {
        ...createdOrganization,
        serviceAddress: createdServiceAddress,
        recordsAddress: createdRecordsAddress,
      } as Organization;
    });
  } catch (error) {
    console.error("Error creating organization:", (error as Error).message);
    return undefined;
  }
};

/**
 * Save changes to an existing organization in the database.
 * @param organizationId - The ID of the organization to update.
 * @param data - The organization data to update.
 * @returns true if the organization was successfully updated, false otherwise.
 */
export const saveOrganization = async (
  organizationId: number,
  data: OrganizationPayload,
) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes("ADMINISTRATOR")) {
    return false; // Only government users with ADMINISTRATOR role can update organizations
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const currentDate = new Date();

      const updateAddress = async (
        addressType: AddressType,
        newAddress: OrganizationAddressSparse | undefined,
      ) => {
        const whereClause = {
          organizationId,
          addressType,
          expirationDate: null,
        };
        if (
          !newAddress ||
          (
            await tx.organizationAddress.findMany({
              select: { id: true },
              where: { ...whereClause, ...newAddress },
            })
          ).length > 0
        ) {
          // No update needed if the new address is not provided or if it already exists
          return;
        }

        // Expire existing addresses
        await tx.organizationAddress.updateMany({
          where: whereClause,
          data: { expirationDate: currentDate },
        });

        // If all fields in the new address are null, do not create the new address
        if (isEmptyAddress(newAddress)) {
          return;
        }

        // Create new address
        await tx.organizationAddress.create({
          data: { ...newAddress, organizationId, addressType },
        });
      };

      await tx.organization.update({
        where: { id: organizationId },
        data: {
          name: data.name,
          shortName: data.shortName,
          isActive: data.isActive,
          isGovernment: data.isGovernment,
        },
      });

      await updateAddress(AddressType.SERVICE, data.serviceAddress);
      await updateAddress(AddressType.RECORDS, data.recordsAddress);

      return true; // Return true if the organization was successfully updated
    });
  } catch (error) {
    console.error("Error saving organization:", (error as Error).message);
    return false; // Return false if there was an error
  }
};
