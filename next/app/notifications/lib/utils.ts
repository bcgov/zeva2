import { InAppNotificationType } from "@/prisma/generated/enums";

export const isNotificationType = (s: string): s is InAppNotificationType => {
  return Object.keys(InAppNotificationType).some((type) => {
    return type === s;
  });
};
