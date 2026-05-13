"use client";

import { TextInput } from "@/app/lib/components/inputs";

export function UserFormFields({
  form,
  onChange,
  disabled,
  type,
}: {
  form: Partial<Record<string, string>>;
  onChange: (field: string, value: any) => void;
  disabled: boolean;
  type: "IDIR" | "BCeID";
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 bg-white">
        <div className="space-y-3">
          <TextInput
            label="First name (required)"
            placeholder="John"
            value={form.firstName ?? ""}
            onChange={(value) => onChange("firstName", value)}
            disabled={disabled}
          />
          <TextInput
            label="Last name (required)"
            placeholder="Smith"
            value={form.lastName ?? ""}
            onChange={(value) => onChange("lastName", value)}
            disabled={disabled}
          />
          <TextInput
            label="Job title (required)"
            placeholder="Analyst"
            value={form.title ?? ""}
            onChange={(value) => onChange("title", value)}
            disabled={disabled}
          />
          <TextInput
            label={`${type} user Id (required)`}
            placeholder="JSMITH"
            value={form.idpUsername ?? ""}
            onChange={(value) => onChange("idpUsername", value)}
            disabled={disabled}
          />
          <TextInput
            label={`${type} user email (required)`}
            type="email"
            placeholder="jsmith@email.com"
            value={form.idpEmail ?? ""}
            onChange={(value) => onChange("idpEmail", value)}
            disabled={disabled}
          />
          <div className="space-y-1">
            <TextInput
              label="Notification email (optional)"
              type="email"
              placeholder="jsmith-notifications@email.com"
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
