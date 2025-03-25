"use client";
import React from "react";
import { Button } from "@/app/lib/components";

export const EmailInput = ({
  initialEmail,
  onSubmit,
}: {
  initialEmail: string;
  onSubmit: (email?: string) => void;
}) => {
  const [email, setEmail] = React.useState(initialEmail);
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };
  return (
    <div>
      <input onChange={handleEmailChange} value={email} />
      <Button
        onClick={() => {
          onSubmit(email);
        }}
      >
        Update
      </Button>
    </div>
  );
};
