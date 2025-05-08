import { getUserInfo } from "@/auth";
import { getOrderByClause, getWhereClause } from "./utils";
import { prisma } from "@/lib/prisma";
import { Prisma, Vehicle, VehicleStatus } from "@/prisma/generated/client";

export type VehicleSparse = Omit<
  Vehicle,
  "vehicleClassCode" | "weightKg" | "organizationId" | "hasPassedUs06Test"
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
    status: true,
    creditValue: true,
    zevClass: true,
    modelYear: true,
    modelName: true,
    make: true,
    range: true,
    vehicleZevType: true,
    isActive: true,
  };
  const where = getWhereClause(filters);
  const orderBy = getOrderByClause(sorts, true);
  if (userIsGov) {
    select = { ...select, organization: { select: { name: true } } };
    where.NOT = {
      status: { in: [VehicleStatus.DRAFT, VehicleStatus.DELETED] },
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

export const getVehicleComments = async (vehicleId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const vehicle_comments = await prisma.vehicleComment.findMany({
    where: {
      vehicleId: vehicleId,
    },
    include: {
      vehicle: {
        include: {
          organization: true,
        },
      },
    },
  });
  if (
    vehicle_comments &&
    vehicle_comments.length >= 1 &&
    (userIsGov || userOrgId == vehicle_comments[0].vehicle.id)
  ) {
    return vehicle_comments;
  }
  return [];
};

export const getVehicle = async (vehicleId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
    include: {
      organization: true,
    },
  });
  if (vehicle && (userIsGov || userOrgId == vehicle.organization.id)) {
    return vehicle;
  }
};

export const getVehicleHistories = async (vehicleId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const vehicle_history = await prisma.vehicleChangeHistory.findMany({
    where: {
      vehicleId: vehicleId,
    },
    include: {
      vehicle: {
        include: {
          organization: true,
        },
      },
    },
  });
  if (
    vehicle_history &&
    vehicle_history.length >= 1 &&
    (userIsGov || userOrgId == vehicle_history[0].vehicle.organization.id)
  ) {
    return vehicle_history;
  }
};
