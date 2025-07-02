"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/app/lib/components";
import { Role, User } from "@/prisma/generated/client";
import { UserPayload } from "../actions";
import { UserFormFields } from "./UserFormFields";
import { REDIRECT_ERROR_CODE } from "next/dist/client/components/redirect-error";
import { getUserPayload } from "../utilsClient";

export const UserForm = ({
  user,
  orgsMap,
  userOrgId,
  govOrgId,
  onSubmit,
}: {
  user?: User;
  orgsMap?: Record<number, string>;
  userOrgId: string;
  govOrgId: string;
  onSubmit: (data: UserPayload) => Promise<never>;
}) => {
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<Partial<Record<string, string>>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        contactEmail: user.contactEmail ?? "",
        idpUsername: user.idpUsername,
        isActive: user.isActive.toString(),
        organizationId: user.organizationId.toString(),
      });
      setRoles(user.roles);
    } else {
      setForm({
        isActive: "true",
        organizationId: userOrgId,
      });
    }
  }, [user, userOrgId]);

  const handleChange = useCallback((key: string, value: string) => {
    setForm((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const toggleRole = useCallback((role: Role) => {
    setRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((element) => element !== role);
      }
      return [...prev, role];
    });
  }, []);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        const payload = getUserPayload(form, roles);
        await onSubmit(payload);
      } catch (e) {
        if (e instanceof Error && e.message !== REDIRECT_ERROR_CODE) {
          setError(e.message);
        }
      }
    });
  }, [user, onSubmit, form, roles]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}

      {orgsMap && (
        <div className="flex items-center py-2 my-2">
          <label className="w-72">Organization</label>
          <select
            name="organizationId"
            className="border p-2 w-full"
            value={form.organizationId ?? ""}
            onChange={(e) => {
              handleChange(e.target.name, e.target.value);
            }}
          >
            {Object.entries(orgsMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      <UserFormFields
        form={form}
        selectedRoles={roles}
        govRoles={form.organizationId === govOrgId}
        onChange={handleChange}
        toggleRole={toggleRole}
      />

      <div className="pt-4 flex gap-4">
        <Button type="submit" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : user ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};
