"use client";

import { getNotificationEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Notification, Role } from "@/prisma/generated/client";
import { useMemo, useState } from "react";
import { Modal } from "@/app/lib/components/Modal";

export function UserFormFields({
  form,
  notifications,
  onChange,
  toggleNotification,
}: {
  form: Partial<Record<string, string>>;
  notifications: Notification[];
  onChange: (field: string, value: any) => void;
  toggleNotification: (role: Notification) => void;
}) {
  const notificationsMap = useMemo(() => {
    return getNotificationEnumsToStringsMap();
  }, []);

  const isActive = form.isActive === "true";
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);

  const handleActiveIntent = (nextChecked: boolean) => {
    setPendingActive(nextChecked);
    setShowStatusModal(true);
  };

  const cancelStatusChange = () => {
    setShowStatusModal(false);
    setPendingActive(null);
  };

  const confirmStatusChange = () => {
    if (pendingActive === null) return;
    onChange("isActive", pendingActive ? "true" : "false");
    setShowStatusModal(false);
    setPendingActive(null);
  };

  const statusModalTitle = pendingActive
    ? "Confirm: Activate User"
    : "Confirm: Deactivate User";
  const modalConfirmLabel = pendingActive ? "Activate" : "Deactivate";
  const modalConfirmClass = pendingActive ? "confirmation" : "error";

  return (
    <>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">First Name</label>
        <input
          name="firstName"
          className="border p-2 w-full"
          value={form.firstName ?? ""}
          onChange={(e) => onChange(e.target.name, e.target.value)}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Last Name</label>
        <input
          name="lastName"
          className="border p-2 w-full"
          value={form.lastName ?? ""}
          onChange={(e) => onChange(e.target.name, e.target.value)}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Contact Email</label>
        <input
          name="contactEmail"
          className="border p-2 w-full"
          value={form.contactEmail ?? ""}
          onChange={(e) => onChange(e.target.name, e.target.value)}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">IDP Username</label>
        <input
          name="idpUsername"
          className="border p-2 w-full"
          value={form.idpUsername ?? ""}
          onChange={(e) => onChange(e.target.name, e.target.value)}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Is Active</label>
        <input
          className="border p-2 w-full"
          type="checkbox"
          name="isActive"
          value="true"
          checked={isActive}
          onChange={(e) => handleActiveIntent(e.target.checked)}
        />
      </div>
      <Modal
        showModal={showStatusModal}
        handleCancel={cancelStatusChange}
        handleSubmit={confirmStatusChange}
        title={statusModalTitle}
        confirmLabel={modalConfirmLabel}
        modalType={modalConfirmClass}
        content={"Are you sure you want to update this user?"}
        disablePrimaryButton={false}
        disableSecondaryButton={false}
      />
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Notifications</label>
        {Object.values(Notification).map((value) => (
          <label className="w-72" key={value}>
            <input
              className="border p-2 w-full"
              type="checkbox"
              checked={notifications.includes(value)}
              onChange={() => toggleNotification(value)}
            />
            {notificationsMap[value]}
          </label>
        ))}
      </div>
    </>
  );
}
