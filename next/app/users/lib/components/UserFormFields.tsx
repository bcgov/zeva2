import React from "react";
import { Role } from "@/prisma/generated/client";

export function UserFormFields({
  form,
  availableRoles,
  onChange,
  toggleRole,
}: {
  form: any;
  availableRoles: Role[];
  onChange: (field: string, value: any) => void;
  toggleRole: (role: Role) => void;
}) {
  return (
    <>
      <div>
        <label>First Name</label>
        <input
          value={form.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
        />
      </div>
      <div>
        <label>Last Name</label>
        <input
          value={form.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
        />
      </div>
      <div>
        <label>Contact Email</label>
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => onChange("contactEmail", e.target.value)}
        />
      </div>
      <div>
        <label>IDP Email</label>
        <input
          type="email"
          value={form.idpEmail}
          onChange={(e) => onChange("idpEmail", e.target.value)}
        />
      </div>
      <div>
        <label>IDP Sub</label>
        <input
          value={form.idpSub}
          onChange={(e) => onChange("idpSub", e.target.value)}
        />
      </div>
      <div>
        <label>IDP Username</label>
        <input
          value={form.idpUsername}
          onChange={(e) => onChange("idpUsername", e.target.value)}
        />
      </div>
      <div>
        <label>Status</label>
        <label>
          <input
            type="radio"
            name="isActive"
            value="true"
            checked={form.isActive === true}
            onChange={() => onChange("isActive", true)}
          />
          Active
        </label>
        <label>
          <input
            type="radio"
            name="isActive"
            value="false"
            checked={form.isActive === false}
            onChange={() => onChange("isActive", false)}
          />
          Inactive
        </label>
      </div>
      <div>
        <label>Roles</label>
        {availableRoles.map((role) => (
          <label key={role}>
            <input
              type="checkbox"
              checked={form.roles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {role.replaceAll("_", " ")}
          </label>
        ))}
      </div>
    </>
  );
}
