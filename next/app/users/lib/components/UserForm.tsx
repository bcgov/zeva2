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
import { RoleSelector } from "./RoleSelector";
import { FormChangeWarning } from "./FormChangeWarning";
import { useNavigationGuard } from "next-navigation-guard";

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
  const [formChanged, setFormChanged] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<Partial<Record<string, string>>>({});
  const [initialForm, setInitialForm] = useState<Partial<Record<string, string>>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();
  
  const navGuard = useNavigationGuard({ enabled: formChanged });

  useEffect(() => {
    if (user) {
      const initialFormData = {
        firstName: user.firstName,
        lastName: user.lastName,
        contactEmail: user.contactEmail ?? "",
        idpUsername: user.idpUsername,
        isActive: user.isActive.toString(),
        organizationId: user.organizationId.toString(),
      };
      setForm(initialFormData);
      setInitialForm(initialFormData);
      setRoles(user.roles);
      setNotifications(user.notifications);
    } else {
      const initialFormData = {
        isActive: "true",
        organizationId: userOrgId,
      };
      setForm(initialFormData);
      setInitialForm(initialFormData);
    }
  }, [user, userOrgId]);

  const handleChange = useCallback((key: string, value: string) => {
    if (key === "organizationId") {
      setRoles([]);
    }
    setForm((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  useEffect(() => {
    if (Object.keys(initialForm).length === 0) {
      return;
    }
    
    const textFieldsChanged = 
      form.firstName !== initialForm.firstName ||
      form.lastName !== initialForm.lastName ||
      form.contactEmail !== initialForm.contactEmail ||
      form.idpUsername !== initialForm.idpUsername;
    
    setFormChanged(textFieldsChanged);
  }, [form, initialForm]);

  // Handle browser navigation (reload, close tab) - shows native browser warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formChanged) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formChanged]);

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
        setFormChanged(false);
        router.push(`${Routes.Users}/${userId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [user, form, roles, notifications, router]);

  const handleSaveAndNavigate = useCallback(async () => {
    try {
      const payload = getUserPayload(form, roles, notifications);
      let response:
        | ErrorOrSuccessActionResponse
        | DataOrErrorActionResponse<number>;
      if (user) {
        response = await updateUser(user.id, payload);
      } else {
        response = await createUser(payload);
      }
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      setFormChanged(false);
      navGuard.accept();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  }, [user, form, roles, notifications, navGuard]);

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
        notifications={notifications}
        onChange={handleChange}
        toggleNotification={toggleNotification}
      />

      <FormChangeWarning
        showWarningModal={navGuard.active}
        handleSaveAndNavigate={handleSaveAndNavigate}
        handleNavigateWithoutSaving={() => {
          setFormChanged(false);
          navGuard.accept();
        }}
        handleClose={navGuard.reject}
        isPending={isPending}
      />

      <RoleSelector
        userId={user ? user.id : undefined}
        govOrSupplier={form.organizationId === govOrgId ? "gov" : "supplier"}
        roles={roles}
        setRoles={setRoles}
        setError={setError}
      />

      <div className="pt-4 flex gap-4">
        <Button type="submit" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : user ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};
