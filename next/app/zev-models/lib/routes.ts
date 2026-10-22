import { Routes } from "@/app/lib/constants";
import { VehicleStatus } from "@/prisma/generated/enums";
import { ZevModelTab, zevModelTabs } from "./constants";

export const isZevModelTab = (slug: string): slug is ZevModelTab => {
  return Object.keys(zevModelTabs).some((tab) => tab === slug);
};

export const getZevModelTabRoute = (tab: ZevModelTab): Routes => {
  return zevModelTabs[tab].route;
};

export const getZevModelDetailsRoute = (
  vehicle: {
    id: number;
    status: VehicleStatus;
    isActive: boolean;
  },
  userIsGov: boolean,
) => {
  if (vehicle.status === VehicleStatus.VALIDATED) {
    return `${
      vehicle.isActive ? Routes.ValidatedZevModels : Routes.InactiveZevModels
    }/${vehicle.id}`;
  }
  if (userIsGov) {
    return `${Routes.SubmittedZevModels}/${vehicle.id}`;
  }
  return `${Routes.InProgressZevModels}/${vehicle.id}`;
};
