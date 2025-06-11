import Link from "next/link";
import { fetchUsers } from "./lib/data";
import { Button } from "@/app/lib/components";
import { UserTable } from "./lib/components/UserTable"
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export default async function Users() {
  const users = await fetchUsers();

  return (
    <div>
      <Link href="/users/new">
        <Button>New User</Button>
      </Link>
      <UserTable
        users={users}
        navigationAction={async (id: number) => {
            "use server";
            redirect(`${Routes.Users}/${id}`);
          }}
      />
    </div>
  );
}
