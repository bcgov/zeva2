"use client";

import {
  getNotificationEnumsToStringsMap,
  getRoleEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Notification, Role } from "@/prisma/generated/client";
import { useMemo, useState } from "react";
import Modal from "../../../lib/components/Modal";

export function UserFormFields({
  form,
  selectedRoles,
  govRoles,
  notifications,
  onChange,
  toggleRole,
  toggleNotification,
  roleUpdate,
}: {
  form: any;
  selectedRoles: Role[];
  govRoles: boolean;
  notifications: Notification[];
  onChange: (field: string, value: any) => void;
  toggleRole: (role: Role) => void;
  toggleNotification: (role: Notification) => void;
  roleUpdate: (role: Role, willAdd: boolean) => void;
}) {
  const rolesMap = useMemo(() => {
    return getRoleEnumsToStringsMap();
  }, []);

  const availableRoles = useMemo(() => {
    if (govRoles) {
      return [Role.ADMINISTRATOR, Role.DIRECTOR, Role.ENGINEER_ANALYST];
    }
    return [
      Role.ORGANIZATION_ADMINISTRATOR,
      Role.SIGNING_AUTHORITY,
      Role.ZEVA_USER,
    ];
  }, [govRoles]);

  const notificationsMap = useMemo(() => {
    return getNotificationEnumsToStringsMap();
  }, []);

  const isActive = form.isActive === "true";
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [pendingRoleWillBeAdded, setPendingRoleWillBeAdded] = useState<boolean | null>(null);

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

  const handleRoleIntent = (role: Role, nextChecked: boolean) => {
    setPendingRole(role);
    setPendingRoleWillBeAdded(nextChecked);
    setShowRoleModal(true);
  };

  const cancelRoleChange = () => {
    setShowRoleModal(false);
    setPendingRole(null);
    setPendingRoleWillBeAdded(null);
  };

  const confirmRoleChange = async () => {
    if (pendingRole == null || pendingRoleWillBeAdded == null) return;

    await Promise.resolve(roleUpdate(pendingRole, pendingRoleWillBeAdded));

    setShowRoleModal(false);
    setPendingRole(null);
    setPendingRoleWillBeAdded(null);
  };

  const roleModalTitle = pendingRoleWillBeAdded
    ? "Confirm: Add Role"
    : "Confirm: Remove Role";
  const roleModalConfirmLabel = pendingRoleWillBeAdded ? "Add Role" : "Remove Role";
  const roleModalType = pendingRoleWillBeAdded ? "confirmation" : "error";

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
      />
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Roles</label>
        {availableRoles.map((role) => (
          <label className="w-72" key={role}>
            <input
              className="border p-2 w-full"
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={(e) => handleRoleIntent(role, e.target.checked)}
            />
            {rolesMap[role]}
          </label>
        ))}
      </div>

      <Modal
        showModal={showRoleModal}
        handleCancel={cancelRoleChange}
        handleSubmit={confirmRoleChange}
        title={roleModalTitle}
        confirmLabel={roleModalConfirmLabel}
        modalType={roleModalType}
        content={
          pendingRoleWillBeAdded
            ? "Are you sure you want to grant this role to the user?"
            : "Are you sure you want to remove this role from the user?"
        }
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
