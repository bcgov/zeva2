import {
  InAppNotificationStatus,
  InAppNotificationType,
} from "@/prisma/generated/enums";
import { InAppNotificationModel } from "@/prisma/generated/models";

export type NotificationObject = InAppNotificationModel & {
  user: {
    firstName: string;
    lastName: string;
  };
  inAppNotificationOrganizations: {
    organization: {
      id: number;
      name: string;
    };
  }[];
};

export type SerializedNotificationSparse = {
  id: number;
  owner: string;
  ownerId: number;
  status: InAppNotificationStatus;
  type: InAppNotificationType;
  audience: string[];
  startDate: string;
  endDate: string;
  allSuppliers: boolean;
};

export type SerializedNotificationFull = SerializedNotificationSparse & {
  title: string;
  message: string;
  audienceIds: number[];
};

export type NotificationPayload = Omit<
  SerializedNotificationFull,
  "id" | "owner" | "ownerId" | "status" | "audience"
>;

export type NotificationFormData = Partial<NotificationPayload> & {
  audience?: string[];
};
