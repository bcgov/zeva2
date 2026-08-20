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

export type ZevModelTab = "validated" | "submitted" | "inactive";

export const zevModelTabs: Readonly<
  {
    label: string;
    slug: ZevModelTab;
    route: Routes;
  }[]
> = [
  { label: "Validated", slug: "validated", route: Routes.ValidatedZevModels },
  { label: "Submitted", slug: "submitted", route: Routes.SubmittedZevModels },
  { label: "Inactive", slug: "inactive", route: Routes.InactiveZevModels },
];
