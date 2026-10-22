import { VehicleModel } from "@/prisma/generated/models";
import { Routes } from "@/app/lib/constants";

export type VehicleSparse = Omit<
  VehicleModel,
  "vehicleClassCode" | "weight" | "organizationId" | "us06RangeGte16"
> & { organization?: { name: string } };

export type VehicleSparseSerialized = Omit<
  VehicleSparse,
  "numberOfUnits" | "isActive"
> & {
  numberOfUnits: string | undefined;
};

export type ZevModelTab =
  | "validated"
  | "submitted"
  | "in-progress"
  | "inactive";

export const zevModelTabs: Record<
  ZevModelTab,
  { label: string; route: Routes }
> = {
  validated: { label: "Validated", route: Routes.ValidatedZevModels },
  submitted: { label: "Submitted", route: Routes.SubmittedZevModels },
  "in-progress": { label: "In Progress", route: Routes.InProgressZevModels },
  inactive: { label: "Inactive", route: Routes.InactiveZevModels },
} as const;
