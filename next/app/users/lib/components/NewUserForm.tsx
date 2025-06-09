'use client';

import React, { useState } from "react";
import { Button } from "@/app/lib/components";
import { Role } from "@/prisma/generated/client";
import { createUser } from "../actions";

const GOV_ROLES: Role[] = [
    Role.ADMINISTRATOR,
    Role.DIRECTOR,
    Role.ENGINEER_ANALYST,
  ];
  
  const ORG_ROLES: Role[] = [
    Role.ORGANIZATION_ADMINISTRATOR,
    Role.SIGNING_AUTHORITY,
    Role.ZEVA_USER,
  ];

export function NewUserForm({
    organizationId,
    isGovernment,
  }: {
    organizationId: number;
    isGovernment: boolean;
  }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contactEmail: "",
    idpEmail: "",
    idpSub: "",
    idpUsername: "",
    isActive: true,
    organizationId,
    roles: [] as Role[],
  });

  const availableRoles = isGovernment ? GOV_ROLES : ORG_ROLES;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role as Role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role as Role],
    }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await createUser(form);
      }}
    >
      <div>
        <label>First Name</label>
        <input
          value={form.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
        />
      </div>

      <div>
        <label>Last Name</label>
        <input
          value={form.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
        />
      </div>

      <div>
        <label>Contact Email</label>
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => handleChange("contactEmail", e.target.value)}
        />
      </div>

      <div>
        <label>IDP Email</label>
        <input
          type="email"
          value={form.idpEmail}
          onChange={(e) => handleChange("idpEmail", e.target.value)}
        />
      </div>

      <div>
        <label>IDP Sub</label>
        <input
          value={form.idpSub}
          onChange={(e) => handleChange("idpSub", e.target.value)}
        />
      </div>

      <div>
        <label>IDP Username</label>
        <input
          value={form.idpUsername}
          onChange={(e) => handleChange("idpUsername", e.target.value)}
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
            onChange={() => handleChange("isActive", true)}
          />
          Active
        </label>
        <label>
          <input
            type="radio"
            name="isActive"
            value="false"
            checked={form.isActive === false}
            onChange={() => handleChange("isActive", false)}
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

      <div className="pt-4">
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
}