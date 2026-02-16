import { getUserInfo } from "@/auth";
import { getOrderByClause, getWhereClause } from "./utilsServer";
import { prisma } from "@/lib/prisma";
import { VehicleStatus } from "@/prisma/generated/enums";
import {
  OrganizationModel,
  VehicleModel,
  VehicleSelect,
  VehicleWhereUniqueInput,
  VehicleHistoryWhereInput,
} from "@/prisma/generated/models";

export type VehicleSparse = Omit<
  VehicleModel,
  "vehicleClassCode" | "weight" | "organizationId" | "us06RangeGte16"
> & { organization?: { name: string } };

// page is 1-based
// currently, this function is not used with SSR, so it is important to select only the data you need!
export const getVehicles = async (
  page: number,
  pageSize: number,
  filters: { [key: string]: string },
  sorts: { [key: string]: string },
): Promise<[VehicleSparse[], number]> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  let select: VehicleSelect = {
    id: true,
    legacyId: true,
    status: true,
    numberOfUnits: true,
    zevClass: true,
    modelYear: true,
    modelName: true,
    make: true,
    range: true,
    zevType: true,
    isActive: true,
    submittedCount: true,
    issuedCount: true,
  };
  const where = getWhereClause(filters);
  const orderBy = getOrderByClause(sorts, true);
  if (userIsGov) {
    select = { ...select, organization: { select: { name: true } } };
    where.NOT = {
      status: {
        in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
      },
    };
  } else {
    where.organizationId = userOrgId;
  }
  return await prisma.$transaction([
    prisma.vehicle.findMany({
      skip,
      take,
      select,
      where,
      orderBy,
    }),
    prisma.vehicle.count({
      where,
    }),
  ]);
};

export type VehicleWithOrg = VehicleModel & {
  organization: OrganizationModel;
  _count: { VehicleAttachment: number };
};

export const getVehicle = async (
  vehicleId: number,
): Promise<VehicleWithOrg | null> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: VehicleWhereUniqueInput = {
    id: vehicleId,
  };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  } else {
    whereClause.NOT = {
      status: {
        in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
      },
    };
  }
  return await prisma.vehicle.findUnique({
    where: whereClause,
    include: {
      organization: true,
      _count: {
        select: {
          VehicleAttachment: true,
        },
      },
    },
  });
};

export const getVehicleHistories = async (vehicleId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: VehicleHistoryWhereInput = {
    vehicleId: vehicleId,
  };
  if (!userIsGov) {
    whereClause.vehicle = {
      organizationId: userOrgId,
    };
  } else {
    whereClause.NOT = {
      vehicle: {
        status: {
          in: [VehicleStatus.DRAFT, VehicleStatus.RETURNED_TO_SUPPLIER],
        },
      },
    };
  }
  return await prisma.vehicleHistory.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          organization: {
            select: {
              isGovernment: true,
            },
          },
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
};
