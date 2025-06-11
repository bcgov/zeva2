"use client";

import React, { useState } from "react";
import { Button } from "@/app/lib/components";
import { Role } from "@/prisma/generated/client";
import { UserCreatePayload, createUser } from "../actions";
import { UserFormFields } from "./UserFormFields";

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
  const [form, setForm] = useState<UserCreatePayload>({
    firstName: "",
    lastName: "",
    contactEmail: "",
    idpEmail: "",
    idpSub: "",
    idpUsername: "",
    isActive: true,
    organizationId,
    roles: [],
  });

  const availableRoles = isGovernment ? GOV_ROLES : ORG_ROLES;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (role: Role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(form); // Now handled internally in the Client Component
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <UserFormFields
        form={form}
        availableRoles={availableRoles}
        onChange={handleChange}
        toggleRole={toggleRole}
      />
      <div className="pt-4">
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
}
