"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import {
  NotificationFormData,
  NotificationPayload,
  SerializedNotificationFull,
} from "../constants";
import { createNotification, updateNotification } from "../actions";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getNotificationPayload } from "../utils";
import { Button, Dropdown, Textarea } from "@/app/lib/components";
import { InAppNotificationType } from "@/prisma/generated/enums";
import { getNotificationTypeEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { BackButton } from "@/app/lib/components/BackButton";

export const NotificationForm = (props: {
  orgsMap: Record<number, string>;
  notification?: SerializedNotificationFull;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<NotificationFormData>({});
  const [error, setError] = useState<string>("");

  const typesMap = useMemo(() => {
    return getNotificationTypeEnumsToStringsMap();
  }, []);

  useEffect(() => {
    if (props.notification) {
      setFormData(props.notification);
    }
  }, [props.notification]);

  const handleSelectAudience = useCallback(
    (selection: string) => {
      if (selection === "All Suppliers") {
        setFormData((prev) => {
          return {
            ...prev,
            audience: [],
            audienceIds: [],
            allSuppliers: true,
          };
        });
      } else {
        const supplier = Object.entries(props.orgsMap).find(
          ([_id, name]) => name === selection,
        );
        if (supplier) {
          const supplierId = Number.parseInt(supplier[0]);
          const supplierName = supplier[1];
          setFormData((prev) => {
            let prevAud = prev.audience;
            let prevAudIds = prev.audienceIds;
            if (
              (!prevAud && !prevAudIds) ||
              (prevAud &&
                !prevAud.includes(supplierName) &&
                prevAudIds &&
                !prevAudIds.includes(supplierId))
            ) {
              const newAud = prevAud
                ? [...prevAud, supplierName]
                : [supplierName];
              const newAudIds = prevAudIds
                ? [...prevAudIds, supplierId]
                : [supplierId];
              return {
                ...prev,
                audience: newAud,
                audienceIds: newAudIds,
                allSuppliers: false,
              };
            }
            return prev;
          });
        }
      }
    },
    [props.orgsMap],
  );

  const handleRemoveAudience = useCallback(
    (removed: string) => {
      if (removed === "All Suppliers") {
        setFormData((prev) => {
          return {
            ...prev,
            allSuppliers: false,
            audience: [],
            audienceIds: [],
          };
        });
      } else {
        const supplier = Object.entries(props.orgsMap).find(
          ([_id, name]) => name === removed,
        );
        if (supplier) {
          const supplierId = Number.parseInt(supplier[0]);
          const supplierName = supplier[1];
          setFormData((prev) => {
            const prevAud = prev.audience;
            const prevAudIds = prev.audienceIds;
            if (
              prevAud &&
              prevAud.includes(supplierName) &&
              prevAudIds &&
              prevAudIds.includes(supplierId)
            ) {
              return {
                ...prev,
                audience: prevAud.filter((name) => name !== supplierName),
                audienceIds: prevAudIds.filter((id) => id !== supplierId),
              };
            }
            return prev;
          });
        }
      }
    },
    [props.orgsMap],
  );

  const handleChange = useCallback(
    (
      key: "type" | "startDate" | "endDate" | "title" | "message",
      value: string,
    ) => {
      setFormData((prev) => {
        return {
          ...prev,
          [key]: value,
        };
      });
    },
    [],
  );

  const handleUpdate = useCallback(() => {
    setError("");
    const existingNotification = props.notification;
    if (existingNotification) {
      const notificationId = existingNotification.id;
      startTransition(async () => {
        try {
          const payload: NotificationPayload = getNotificationPayload(formData);
          const response = await updateNotification(notificationId, payload);
          if (response.responseType === "error") {
            throw new Error(response.message);
          }
          router.push(`${Routes.Notifications}/${notificationId}`);
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          }
        }
      });
    }
  }, [formData]);

  const handleCreate = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const payload: NotificationPayload = getNotificationPayload(formData);
        const response = await createNotification(payload);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const notificationId = response.data;
        router.push(`${Routes.Notifications}/${notificationId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [formData]);

  const handleStartOver = useCallback(() => {
    setFormData({});
    setError("");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col border border-dividerMedium rounded">
          <div className="px-5 py-4 font-bold text-xl">
            Notification Details
          </div>
          <div className="flex flex-col p-4 gap-4">
            <Dropdown
              label="Notification Type"
              helperText="Please choose notification type"
              options={Object.values(InAppNotificationType).map((type) => {
                return {
                  value: type,
                  label: typesMap[type] ?? type,
                };
              })}
              value={formData.type}
              onChange={(value) => handleChange("type", value)}
              disabled={isPending}
            />
            <Textarea
              label="Notification Title"
              placeholder="Enter Title"
              value={formData.title}
              onChange={(value) => handleChange("title", value)}
              noMaxWidth={true}
              disabled={isPending}
            />
            <Textarea
              label="Notification Message"
              placeholder="Enter Message"
              value={formData.message}
              onChange={(value) => handleChange("message", value)}
              noMaxWidth={true}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col border border-dividerMedium rounded">
            <div className="flex flex-col gap-2 px-5 py-4 bg-disabledSurface">
              <span className="font-bold text-xl">Audience</span>
              <span>
                Select All Vehicle Suppliers or choose one or more suppliers
                from the dropdown list.
              </span>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <Dropdown
                label="Select Audience"
                options={[
                  { value: "All Suppliers", label: "All Suppliers" },
                ].concat(
                  Object.values(props.orgsMap).map((supplierName) => {
                    return {
                      value: supplierName,
                      label: supplierName,
                    };
                  }),
                )}
                value={undefined}
                onChange={(value) => handleSelectAudience(value)}
                disabled={isPending}
              />
              {(formData.allSuppliers ||
                (formData.audience && formData.audience.length > 0)) && (
                <div className="flex flex-col divide-y divide-dividerMedium border border-dividerMedium rounded">
                  <div className="flex flex-row justify-between px-4 py-3">
                    <span className="text-sm font-bold">Supplier</span>
                    <span className="text-sm font-bold">Delete</span>
                  </div>
                  {(formData.allSuppliers
                    ? ["All Suppliers"]
                    : (formData.audience ?? [])
                  ).map((supplier, index) => {
                    return (
                      <div
                        key={index}
                        className={`flex flex-row justify-between px-4 py-3 ${index % 2 === 0 ? "bg-lightGrey" : ""}`}
                      >
                        <span>{supplier}</span>
                        {isPending ? (
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="text-gray-500"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="text-primaryRed cursor-pointer"
                            onClick={() => handleRemoveAudience(supplier)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col border border-dividerMedium rounded">
            <div className="flex flex-col gap-2 px-5 py-4 bg-disabledSurface">
              <span className="font-bold text-xl">Schedule</span>
              <span>
                Set when this notification should become visible and when it
                should expire.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 p-4">
              <div className="flex flex-1 flex-col gap-2">
                <span>Start Date</span>
                <input
                  className="px-4 py-3 border border-dividerMedium rounded"
                  type="date"
                  value={formData.startDate ?? ""}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <span>End Date</span>
                <input
                  className="px-4 py-3 border border-dividerMedium rounded"
                  type="date"
                  value={formData.endDate ?? ""}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between p-5 bg-lightGrey">
        <div className="flex flex-row gap-4">
          <BackButton />
          {!props.notification && (
            <Button
              variant="danger"
              disabled={isPending}
              onClick={handleStartOver}
              icon={<FontAwesomeIcon icon={faTrash} />}
              iconPosition="right"
            >
              Delete and Start Over
            </Button>
          )}
        </div>
        <div className="flex flex-row items-center gap-4">
          {error && <span className="text-red-600">{error}</span>}
          <Button
            variant="primary"
            disabled={isPending}
            onClick={props.notification ? handleUpdate : handleCreate}
            icon={<FontAwesomeIcon icon={faFloppyDisk} />}
            iconPosition="right"
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
