import { Routes } from "@/app/lib/constants";
import { VehicleStatus } from "@/prisma/generated/enums";

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

export const isZevModelTab = (slug: string): slug is ZevModelTab => {
  return zevModelTabs.some((tab) => tab.slug === slug);
};

export const getZevModelTabRoute = (tab: ZevModelTab): Routes => {
  return (
    zevModelTabs.find((item) => item.slug === tab)?.route ??
    Routes.SubmittedZevModels
  );
};

export const getZevModelDetailsRoute = (vehicle: {
  id: number;
  status: VehicleStatus;
  isActive: boolean;
}) => {
  if (vehicle.status === VehicleStatus.VALIDATED) {
    return `${
      vehicle.isActive ? Routes.ValidatedZevModels : Routes.InactiveZevModels
    }/${vehicle.id}/details`;
  }

  return `${Routes.SubmittedZevModels}/${vehicle.id}/details`;
};
