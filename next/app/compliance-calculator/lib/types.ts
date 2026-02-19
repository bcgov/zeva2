import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";

export type ComplianceRatio = {
  modelYear: ModelYear;
  complianceRatio: number;
  zevClassA: number;
};

export type VehicleModel = {
  id: number;
  make: string;
  modelName: string;
  modelYear: ModelYear;
  creditValue: number;
  creditClass: ZevClass;
  isActive: boolean;
};

export type SupplierSize = "small" | "medium" | "large" | "";

export type ComplianceNumbers = {
  total: number | string;
  classA: number | string;
  remaining: number | string;
};

export type EstimatedModelSale = {
  id: number;
  value: number;
  estimatedSalesNum: number;
  creditClass: ZevClass;
};

export type CreditBalance = {
  A: number;
  B: number;
};
