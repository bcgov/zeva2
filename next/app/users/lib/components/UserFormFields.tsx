"use client";

import {
  getNotificationEnumsToStringsMap,
  getRoleEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Notification, Role } from "@/prisma/generated/client";
import { useMemo } from "react";

export function UserFormFields({
  form,
  selectedRoles,
  govRoles,
  notifications,
  onChange,
  toggleRole,
  toggleNotification,
}: {
  form: any;
  selectedRoles: Role[];
  govRoles: boolean;
  notifications: Notification[];
  onChange: (field: string, value: any) => void;
  toggleRole: (role: Role) => void;
  toggleNotification: (role: Notification) => void;
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
          checked={form.isActive === "true"}
          onChange={(e) =>
            onChange(e.target.name, e.target.checked ? "true" : "false")
          }
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Roles</label>
        {availableRoles.map((role) => (
          <label className="w-72" key={role}>
            <input
              className="border p-2 w-full"
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {rolesMap[role]}
          </label>
        ))}
      </div>
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
