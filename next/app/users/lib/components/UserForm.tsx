"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/app/lib/components";
import { Role, User } from "@/prisma/generated/client";
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
import { Modal } from "@/app/lib/components/Modal";

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
  const [initialForm, setInitialForm] = useState<
    Partial<Record<string, string>>
  >({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);
  const [submitClicked, setSubmitClicked] = useState<boolean>(false);

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
    handleChange("isActive", pendingActive ? "true" : "false");
    setShowStatusModal(false);
    setPendingActive(null);
  };
  const [guardEnabled, setGuardEnabled] = useState<boolean>(false);
  const navGuard = useNavigationGuard({ enabled: guardEnabled });

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

  const textFieldsChanged = useCallback(() => {
    if (Object.keys(initialForm).length === 0) {
      return false;
    }
    return (
      form.firstName !== initialForm.firstName ||
      form.lastName !== initialForm.lastName ||
      form.contactEmail !== initialForm.contactEmail ||
      form.idpUsername !== initialForm.idpUsername
    );
  }, [form, initialForm]);

  useEffect(() => {
    setGuardEnabled(textFieldsChanged());
  }, [textFieldsChanged]);

  // Handle browser navigation (reload, close tab) - shows native browser warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (guardEnabled) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [guardEnabled]);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        if (!form.organizationId) {
          throw new Error("Unexpected Error!");
        }
        const payload = getUserPayload(
          form,
          roles,
          form.organizationId === govOrgId,
        );
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
        if (guardEnabled) {
          navGuard.accept();
        } else {
          router.push(`${Routes.Users}/${userId}`);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
        if (guardEnabled) {
          navGuard.reject();
        } else {
          setGuardEnabled(textFieldsChanged());
        }
      }
    });
  }, [user, form, roles, guardEnabled, navGuard, govOrgId]);

  // Allow deferred submit after turning off guard
  useEffect(() => {
    if (!guardEnabled && submitClicked) {
      setSubmitClicked(false);
      handleSubmit();
    }
  }, [guardEnabled, submitClicked, handleSubmit]);

  return (
    <div className="bg-lightGrey min-h-screen text-primaryText">
      <div className="w-full px-2 py-4 space-y-4 sm:px-4 lg:px-8 xl:px-12">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-primaryText">
            Government User Management
          </h1>
          <p className="text-sm text-secondaryText">
            Manage user account details, status, and roles.
          </p>
          {error && (
            <p className="rounded-md border border-error/40 bg-primaryRed/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.7fr,1fr] 2xl:grid-cols-[2fr,1fr]">
          <section className="space-y-5 rounded-lg border border-dividerMedium/40 bg-white p-4 shadow-sm lg:p-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-primaryText">
                {user ? "Edit user" : "Create user"}
              </h2>
            </div>

            {orgsMap && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-primaryText">
                  Organization
                </label>
                <select
                  name="organizationId"
                  className="form-input-base"
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
              onChange={handleChange}
              disabled={isPending}
            />
          </section>

          <div className="space-y-3">
            <section className="space-y-3 rounded-lg border border-dividerMedium/40 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-primaryText">
                Account
              </h3>
              <p className="flex items-center gap-2 text-sm text-secondaryText">
                {user && user.idpSub
                  ? "User account is mapped."
                  : "User account has not been mapped."}
              </p>
            </section>

            <section className="space-y-3 rounded-lg border border-dividerMedium/40 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primaryText">
                  Status
                </h3>
                <span className="text-xs font-medium text-secondaryText">
                  Controls login access
                </span>
              </div>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dividerMedium/60 px-4 py-3 hover:border-primaryBlue">
                  <input
                    className="mt-1 h-4 w-4 accent-success"
                    type="radio"
                    name="status"
                    checked={form.isActive === "true"}
                    onChange={() => handleActiveIntent(true)}
                  />
                  <div className="space-y-1">
                    <p className="text-success font-semibold">Active</p>
                    <p className="text-sm text-secondaryText">
                      User can log in and perform actions based on their
                      assigned role.
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dividerMedium/60 px-4 py-3 hover:border-primaryRed">
                  <input
                    className="mt-1 h-4 w-4 accent-error"
                    type="radio"
                    name="status"
                    checked={form.isActive === "false"}
                    onChange={() => handleActiveIntent(false)}
                  />
                  <div className="space-y-1">
                    <p className="text-error font-semibold">Inactive</p>
                    <p className="text-sm text-secondaryText">
                      Prevents login and notifications. Activity history is
                      retained.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-dividerMedium/40 bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-primaryText">
                  Roles
                </h3>
                <p className="text-sm text-secondaryText">
                  Users can have more than one role except ZEVA IDIR User
                  (read-only), which must be assigned on its own.
                </p>
              </div>
              <RoleSelector
                userId={user ? user.id : undefined}
                govOrSupplier={
                  form.organizationId === govOrgId ? "gov" : "supplier"
                }
                roles={roles}
                setRoles={setRoles}
                setError={setError}
                disabled={isPending}
              />
            </section>
          </div>
        </div>

        <FormChangeWarning
          showWarningModal={navGuard.active}
          handleSaveAndNavigate={handleSubmit}
          handleNavigateWithoutSaving={navGuard.accept}
          handleClose={navGuard.reject}
          isPending={isPending}
        />

        <Modal
          showModal={showStatusModal}
          handleCancel={cancelStatusChange}
          handleSubmit={confirmStatusChange}
          title={
            pendingActive
              ? "Confirm: Activate User"
              : "Confirm: Deactivate User"
          }
          confirmLabel={pendingActive ? "Activate" : "Deactivate"}
          modalType={pendingActive ? "confirmation" : "error"}
          content="Are you sure you want to update this user?"
          disablePrimaryButton={false}
          disableSecondaryButton={false}
        />

        <div className="flex items-center justify-end gap-4 border-t border-dividerMedium/30 pt-4">
          <Button
            type="button"
            className="rounded-md border border-dividerMedium bg-white px-4 py-2 text-sm font-medium text-primaryText hover:border-primaryBlue hover:text-primaryBlue"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            type="submit"
            onClick={() => {
              setGuardEnabled(false);
              setSubmitClicked(true);
            }}
            disabled={isPending}
            className="rounded-md bg-primaryBlue px-5 py-2 text-sm font-semibold text-textOnPrimary shadow-sm hover:bg-primaryBlueHover disabled:cursor-not-allowed disabled:bg-disabledBG disabled:text-disabledText"
          >
            {isPending ? "..." : user ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
};
