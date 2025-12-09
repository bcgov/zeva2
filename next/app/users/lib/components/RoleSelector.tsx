"use client";

import { Modal } from "@/app/lib/components/Modal";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Role } from "@/prisma/generated/client";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { updateRoles } from "../actions";
import { govRoles, supplierRoles } from "../constants";
import { validateRoles } from "../utilsClient";

export const RoleSelector = (props: {
  // if userId is undefined, then we're using this component as part of the "create user" process;
  // otherwise, it is used as part of the "update user" process
  userId?: number;
  govOrSupplier: "gov" | "supplier";
  roles: Role[];
  setRoles: Dispatch<SetStateAction<Role[]>>;
  setError: Dispatch<SetStateAction<string>>;
  disabled: boolean;
}) => {
  const [roleInQuestion, setRoleInQuestion] = useState<{
    role: Role;
    addOrRemove: "add" | "remove";
  } | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const roles: readonly Role[] = useMemo(() => {
    if (props.govOrSupplier === "gov") {
      return govRoles;
    } else if (props.govOrSupplier === "supplier") {
      return supplierRoles;
    }
    return [];
  }, [props.govOrSupplier]);

  const rolesMap = useMemo(() => {
    return getRoleEnumsToStringsMap();
  }, []);

  const roleDescriptions: Partial<Record<Role, string>> = useMemo(
    () => ({
      [Role.ORGANIZATION_ADMINISTRATOR]:
        "Can add and manage BCeID users and assign roles.",
      [Role.SIGNING_AUTHORITY]:
        "Can sign-off and submit Credit Applications and Transfers to government.",
      [Role.ZEVA_USER]:
        "Can submit new ZEV models and create Credit Applications and Transfers.",
      [Role.ENGINEER_ANALYST]:
        "Can add new auto suppliers and BCeID users, validate new ZEV Models; upload ICBC data, analyse and recommend issuance of Credit Applications and Transfers.",
      [Role.ADMINISTRATOR]: "Can add and manage IDIR users and assign roles.",
      [Role.DIRECTOR]:
        "Can provide statutory decisions to issue, record and/or approve Credit Applications and Transfers.",
    }),
    [],
  );

  const handleRoleCheck = useCallback(
    (role: Role, checked: boolean) => {
      if (props.userId === undefined) {
        props.setRoles((prev) => {
          if (prev.includes(role)) {
            return prev.filter((element) => element !== role);
          }
          return [...prev, role];
        });
      } else {
        setRoleInQuestion({ role, addOrRemove: checked ? "add" : "remove" });
        setShowModal(true);
      }
    },
    [props.userId, props.setRoles],
  );

  const handleCancel = useCallback(() => {
    setRoleInQuestion(null);
    setShowModal(false);
  }, []);

  const updateUserRoles = useCallback(() => {
    props.setError("");
    startTransition(async () => {
      try {
        if (props.userId === undefined || !roleInQuestion) {
          throw new Error("Cannot update user roles!");
        }
        if (roleInQuestion.addOrRemove === "add") {
          const newRoles = [...props.roles, roleInQuestion.role];
          validateRoles(newRoles);
        }
        const resp = await updateRoles(
          props.userId,
          roleInQuestion.role,
          roleInQuestion.addOrRemove,
        );
        if (resp.responseType === "error") {
          props.setError(resp.message);
        } else {
          props.setRoles(resp.data);
        }
      } catch (e) {
        if (e instanceof Error) {
          props.setError(e.message);
        }
      }
      setShowModal(false);
    });
  }, [props.userId, roleInQuestion, props.setError]);

  return (
    <>
      <div className="space-y-2">
        {roles.map((role) => (
          <label
            className="flex items-start gap-3 rounded-md border border-dividerMedium/50 bg-disabledSurface px-3 py-2 text-sm text-primaryText"
            key={role}
          >
            <input
              className="mt-1 h-4 w-4 accent-primaryBlue"
              type="checkbox"
              checked={props.roles.includes(role)}
              onChange={(e) => handleRoleCheck(role, e.target.checked)}
              disabled={props.disabled}
            />
            <span className="space-y-1">
              <p className="font-semibold text-primaryText">{rolesMap[role]}</p>
              {roleDescriptions[role] && (
                <p className="text-sm text-secondaryText">
                  {roleDescriptions[role]}
                </p>
              )}
            </span>
          </label>
        ))}
      </div>
      <Modal
        showModal={showModal}
        modalType="confirmation"
        handleCancel={handleCancel}
        handleSubmit={updateUserRoles}
        title="User Roles Change"
        confirmLabel="Yes"
        content="You are about to modify this user's roles. Are you sure you want to proceed?"
        disablePrimaryButton={isPending}
        disableSecondaryButton={isPending}
      />
    </>
  );
};
