"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/app/lib/components";
import { Notification, Role, User } from "@/prisma/generated/client";
import { createUser, updateUser } from "../actions";
import { UserFormFields } from "./UserFormFields";
import { getUserPayload } from "../utilsClient";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";

export const UserForm = ({
  user,
  orgsMap,
  userOrgId,
  govOrgId,
}: {
  user?: User;
  orgsMap?: Record<number, string>;
  userOrgId: string;
  govOrgId: string;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<Partial<Record<string, string>>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
      setNotifications(user.notifications);
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

  const toggleNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      if (prev.includes(notification)) {
        return prev.filter((element) => element !== notification);
      }
      return [...prev, notification];
    });
  }, []);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        const payload = getUserPayload(form, roles, notifications);
        let response:
          | ErrorOrSuccessActionResponse
          | DataOrErrorActionResponse<number>;
        let userId: number | undefined;
        if (user) {
          userId = user.id;
          response = await updateUser(user.id, payload);
        } else {
          response = await createUser(payload);
          if (response.responseType === "data") {
            userId = response.data;
          }
        }
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(`${Routes.Users}/${userId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [user, form, roles, router]);

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
        notifications={notifications}
        onChange={handleChange}
        toggleRole={toggleRole}
        toggleNotification={toggleNotification}
      />

      <div className="pt-4 flex gap-4">
        <Button type="submit" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : user ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};
