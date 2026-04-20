"use client";

import { TextInput } from "@/app/lib/components/inputs";

export function UserFormFields({
  form,
  onChange,
  disabled,
}: {
  form: Partial<Record<string, string>>;
  onChange: (field: string, value: any) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-dividerMedium/30 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <TextInput
            label="First name (required)"
            placeholder="Test name"
            value={form.firstName ?? ""}
            onChange={(value) => onChange("firstName", value)}
            disabled={disabled}
          />
          <TextInput
            label="Last name (required)"
            placeholder="Test last name"
            value={form.lastName ?? ""}
            onChange={(value) => onChange("lastName", value)}
            disabled={disabled}
          />
          <TextInput
            label="Job title (required)"
            placeholder="Policy Analyst"
            value={form.idpUsername ?? ""}
            onChange={(value) => onChange("idpUsername", value)}
            disabled={disabled}
          />
          <TextInput
            label="IDIR user Id (required)"
            placeholder="TEST"
            value={form.idpUsername ?? ""}
            onChange={(value) => onChange("idpUsername", value)}
            disabled={disabled}
          />
          <TextInput
            label="IDIR user email (required)"
            type="email"
            placeholder="test@gov.bc.ca"
            value={form.contactEmail ?? ""}
            onChange={(value) => onChange("contactEmail", value)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <TextInput
              label="Notification email (optional)"
              type="email"
              placeholder="test@gov.bc.ca"
              hintText="The email used to receive notifications, if different from above"
              helpIcon
              value={form.contactEmail ?? ""}
              onChange={(value) => onChange("contactEmail", value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
