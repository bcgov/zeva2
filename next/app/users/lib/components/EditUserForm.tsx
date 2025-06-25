"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/app/lib/components";
import { Role, User } from "@/prisma/generated/client";
import { UserUpdatePayload } from "../actions";
import { UserFormFields } from "./UserFormFields";
import { deleteUser } from "../actions";

export function EditUserForm({
  user,
  onSubmit,
  isGovernment,
}: {
  user: User;
  onSubmit: (updated: UserUpdatePayload) => void;
  isGovernment: boolean;
}) {
  const [form, setForm] = useState<UserUpdatePayload>({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    contactEmail: user.contactEmail ?? "",
    idpEmail: user.idpEmail ?? "",
    idpSub: user.idpSub ?? "",
    idpUsername: user.idpUsername ?? "",
    isActive: user.isActive,
    roles: user.roles,
  });

  const [isPending, startTransition] = useTransition();

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

  const availableRoles = isGovernment ? GOV_ROLES : ORG_ROLES;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (role: Role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r: Role) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this user?")) {
      startTransition(() => {
        deleteUser(user.id);
      });
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <UserFormFields
        form={form}
        availableRoles={availableRoles}
        onChange={handleChange}
        toggleRole={toggleRole}
      />

      <div className="pt-4 flex gap-4">
        <Button type="submit">Save</Button>
        <Button type="button" onClick={handleDelete} disabled={isPending}>
          Delete User
        </Button>
      </div>
    </form>
  );
}
