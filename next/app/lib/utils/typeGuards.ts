import {
  ModelYear,
  Notification,
  VehicleClass,
  ZevClass,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";

export const isVehicleClass = (s: string): s is VehicleClass => {
  return Object.keys(VehicleClass).some((vehicleClass) => {
    return vehicleClass === s;
  });
};

export const isZevClass = (s: string): s is ZevClass => {
  return Object.keys(ZevClass).some((zevClass) => {
    return zevClass === s;
  });
};

export const isModelYear = (s: string): s is ModelYear => {
  return Object.keys(ModelYear).some((modelYear) => {
    return modelYear === s;
  });
};

export const isNotification = (s: string): s is Notification => {
  return Object.keys(Notification).some((notification) => {
    return notification === s;
  });
};

export const isZevUnitTransferStatus = (
  s: string,
): s is ZevUnitTransferStatuses => {
  return Object.keys(ZevUnitTransferStatuses).some((status) => {
    return status === s;
  });
};
