import { validateDate } from "@/app/lib/utils/date";
import { NotificationFormData, NotificationPayload } from "./constants";
import { InAppNotificationType } from "@/prisma/generated/enums";

export const getNotificationPayload = (
  data: NotificationFormData,
): NotificationPayload => {
  const type = data.type;
  const startDate = data.startDate;
  const endDate = data.endDate;
  const allSuppliers = data.allSuppliers;
  const title = data.title;
  const message = data.message;
  const audienceIds = data.audienceIds;
  if (
    !type ||
    !Object.values(InAppNotificationType).includes(type) ||
    !startDate ||
    !endDate ||
    allSuppliers === undefined ||
    !title ||
    !message ||
    !audienceIds ||
    (!allSuppliers && audienceIds.length === 0)
  ) {
    throw new Error("All fields required!");
  }
  if (title.trim().length === 0 || message.trim().length === 0) {
    throw new Error("Title and Message must be non-empty!");
  }
  const [startDateValid, startDateObj] = validateDate(startDate);
  const [endDateValid, endDateObj] = validateDate(endDate);
  if (!startDateValid || !endDateValid || startDateObj >= endDateObj) {
    throw new Error(
      "Dates must be valid, and the Start Date must be before the End Date!",
    );
  }
  return {
    type,
    startDate,
    endDate,
    allSuppliers,
    title: title.trim(),
    message: message.trim(),
    audienceIds: allSuppliers ? [] : [...new Set(audienceIds)],
  };
};
