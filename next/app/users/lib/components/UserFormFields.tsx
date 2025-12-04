"use client";

import { getNotificationEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Notification } from "@/prisma/generated/client";
import { useMemo, useState } from "react";
import { Modal } from "@/app/lib/components/Modal";

export function UserFormFields({
  form,
  notifications,
  onChange,
  toggleNotification,
}: {
  form: Partial<Record<string, string>>;
  notifications: Notification[];
  onChange: (field: string, value: any) => void;
  toggleNotification: (role: Notification) => void;
}) {
  const notificationsMap = useMemo(() => {
    return getNotificationEnumsToStringsMap();
  }, []);

  const isActive = form.isActive === "true";

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-dividerMedium/30 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="form-label">First name (required)</label>
            <input
              name="firstName"
              className="form-input-base"
              placeholder="Test name"
              value={form.firstName ?? ""}
              onChange={(e) => onChange(e.target.name, e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="form-label">Last name (required)</label>
            <input
              name="lastName"
              className="form-input-base"
              placeholder="Test last name"
              value={form.lastName ?? ""}
              onChange={(e) => onChange(e.target.name, e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="form-label">Job title (required)</label>
            <input
              name="idpUsername"
              className="form-input-base"
              placeholder="Policy Analyst"
              value={form.idpUsername ?? ""}
              onChange={(e) => onChange(e.target.name, e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="form-label">IDIR user Id (required)</label>
            <input
              name="idpUsername"
              className="form-input-base"
              placeholder="TEST"
              value={form.idpUsername ?? ""}
              onChange={(e) => onChange(e.target.name, e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="form-label">IDIR user email (required)</label>
            <input
              name="contactEmail"
              className="form-input-base"
              placeholder="test@gov.bc.ca"
              value={form.contactEmail ?? ""}
              onChange={(e) => onChange(e.target.name, e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="form-label">Notification email (optional)</label>
            <p className="text-xs text-secondaryText">
              The email used to receive notifications, if different from above
            </p>
            <input
              name="contactEmail"
              className="form-input-base"
              placeholder="test@gov.bc.ca"
              value={form.contactEmail ?? ""}
              onChange={(e) => onChange(e.target.name, e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
