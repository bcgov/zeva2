import { getUserInfo } from "@/auth";
import { getOrderByClause, getWhereClause } from "./utils";
import { prisma } from "@/lib/prisma";
import {
  Organization,
  Prisma,
  Vehicle,
  VehicleStatus,
} from "@/prisma/generated/client";

export type VehicleSparse = Omit<
  Vehicle,
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
  let select: Prisma.VehicleSelect = {
    id: true,
    legacyId: true,
    status: true,
    numberOfUnits: true,
    zevClass: true,
    modelYear: true,
    modelName: true,
    make: true,
    range: true,
    vehicleZevType: true,
    isActive: true,
    submittedCount: true,
    issuedCount: true,
  };
  const where = getWhereClause(filters);
  where.NOT = {
    status: VehicleStatus.DELETED,
  };
  const orderBy = getOrderByClause(sorts, true);
  if (userIsGov) {
    select = { ...select, organization: { select: { name: true } } };
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

export type VehicleWithOrg = Vehicle & { organization: Organization };

export const getVehicle = async (
  vehicleId: number,
): Promise<VehicleWithOrg | null> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: Prisma.VehicleWhereUniqueInput = {
    id: vehicleId,
    status: {
      not: VehicleStatus.DELETED,
    },
  };
  if (!userIsGov) {
    whereClause = { ...whereClause, organizationId: userOrgId };
  }
  return await prisma.vehicle.findUnique({
    where: whereClause,
    include: {
      organization: true,
    },
  });
};

export type SerializedVehicleWithOrg = Omit<Vehicle, "numberOfUnits"> & {
  numberOfUnits: string;
} & {
  organization: Organization;
};

export const getSerializedVehicle = async (
  vehicleId: number,
): Promise<SerializedVehicleWithOrg | null> => {
  const vehicle = await getVehicle(vehicleId);
  if (vehicle) {
    return {
      ...vehicle,
      weight: vehicle.weight,
      numberOfUnits: vehicle.numberOfUnits.toString(),
    };
  }
  return null;
};

export const getVehicleHistories = async (vehicleId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: Prisma.VehicleHistoryWhereInput = {
    vehicleId: vehicleId,
    vehicle: {
      status: {
        not: VehicleStatus.DELETED,
      },
    },
  };
  if (!userIsGov) {
    whereClause = { ...whereClause, vehicle: { organizationId: userOrgId } };
  }
  return await prisma.vehicleHistory.findMany({
    where: whereClause,
    include: {
      vehicle: {
        include: {
          organization: true,
        },
      },
      user: {
        include: {
          organization: true,
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
};

export const getAttachmentsCount = async (id: number): Promise<number> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.VehicleAttachmentWhereInput = { vehicleId: id };
  if (!userIsGov) {
    whereClause.vehicle = {
      organizationId: userOrgId,
    };
  }
  return await prisma.vehicleAttachment.count({
    where: whereClause,
  });
};
