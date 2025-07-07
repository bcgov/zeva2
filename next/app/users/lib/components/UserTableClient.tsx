"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserTable } from "./UserTable";
import type { UserWithOrgName } from "../data";

interface Props {
  users: UserWithOrgName[];
  totalCount: number;
}

export default function UserTableClient({ users, totalCount }: Props) {
  const router = useRouter();

  return (
    <UserTable
      users={users}
      totalCount={totalCount}
      navigationAction={(id) => {
        router.push(`/users/${id}`);
      }}
    />
  );
}
