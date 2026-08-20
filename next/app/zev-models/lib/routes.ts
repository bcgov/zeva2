import { Routes } from "@/app/lib/constants";
import { VehicleStatus } from "@/prisma/generated/enums";
import { ZevModelTab, zevModelTabs } from "./constants";

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
    }/${vehicle.id}`;
  }

  return `${Routes.SubmittedZevModels}/${vehicle.id}`;
};
