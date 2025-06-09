import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { organizationLDVSuppliedClause } from "./utils";

export const getOrganizationDetails = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== id) {
    // Only government users or users from the organization itself can view the details
    return null;
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id,
    },
    include: {
      organizationAddress: {
        select: {
          addressType: true,
          addressLines: true,
          city: true,
          state: true,
          postalCode: true,
          county: true,
          country: true,
          representative: true,
        },
        where: {
          expirationDate: null, // Only get current addresses
        },
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          roles: true,
        },
        where: {
          isActive: true, // Only get active users
        }
      },
      ldvSupplied: organizationLDVSuppliedClause
    },
  });
  return organization;
};