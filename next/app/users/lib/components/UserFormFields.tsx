"use client";

import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Role } from "@/prisma/generated/client";
import { useMemo } from "react";

export function UserFormFields({
  form,
  selectedRoles,
  govRoles,
  onChange,
  toggleRole,
}: {
  form: any;
  selectedRoles: Role[];
  govRoles: boolean;
  onChange: (field: string, value: any) => void;
  toggleRole: (role: Role) => void;
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
    </>
  );
}
