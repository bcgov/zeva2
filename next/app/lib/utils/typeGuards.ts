import {
  ModelYear,
  Notification,
  TransactionType,
  VehicleClass,
  VehicleClassCode,
  VehicleStatus,
  ZevType,
  ZevClass,
  AgreementType,
} from "@/prisma/generated/client";

export const isTransactionType = (s: string): s is TransactionType => {
  return Object.keys(TransactionType).some((transactionType) => {
    return transactionType === s;
  });
};

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

export const isZevType = (s: string): s is ZevType => {
  return Object.keys(ZevType).some((type) => {
    return type === s;
  });
};

export const isVehicleStatus = (s: string): s is VehicleStatus => {
  return Object.keys(VehicleStatus).some((status) => {
    return status === s;
  });
};

export const isVehicleClassCode = (s: string): s is VehicleClassCode => {
  return Object.keys(VehicleClassCode).some((classCode) => {
    return classCode === s;
  });
};

export const isAgreementType = (s: string): s is AgreementType => {
  return Object.keys(AgreementType).some((type) => {
    return type === s;
  });
};
