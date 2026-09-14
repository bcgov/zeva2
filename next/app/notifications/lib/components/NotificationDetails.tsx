import { getNotificationTypeEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { SerializedNotificationFull } from "../constants";
import { JSX } from "react";

export const NotificationDetails = (props: {
  notification: SerializedNotificationFull;
  messageBanner: JSX.Element;
}) => {
  const typesMap = getNotificationTypeEnumsToStringsMap();
  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="p-5 bg-disabledSurface font-bold text-xl">
        Notification Details
      </div>
      <div className="grid grid-cols-2 gap-y-5 p-5">
        <span className="font-bold">Notification Owner:</span>
        <span>{props.notification.owner}</span>
        <hr className="col-span-2 border-disabledSurface"></hr>
        <span className="font-bold">Notification Type:</span>
        <span>{typesMap[props.notification.type]}</span>
        <hr className="col-span-2 border-disabledSurface"></hr>
        <span className="font-bold">Audience:</span>
        <span>
          {props.notification.allSuppliers
            ? "All Suppliers"
            : props.notification.audience.join(", ")}
        </span>
        <hr className="col-span-2 border-disabledSurface"></hr>
        <span className="font-bold">Schedule:</span>
        <div className="flex flex-col">
          <span>Start Date: {props.notification.startDate}</span>
          <span>End Date: {props.notification.endDate}</span>
        </div>
        <hr className="col-span-2 border-disabledSurface"></hr>
        <span className="col-span-2 font-bold text-lg">
          This is how your notification appears/appeared/will appear to the
          Audience:
        </span>
        <div className="col-span-2">{props.messageBanner}</div>
      </div>
    </div>
  );
};
