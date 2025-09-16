import { getUserInfo } from "@/auth";
import { getUser } from "../data";
import { userIsAdmin } from "../utils";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import Link from "next/link";

export const ActionBar = async (props: { userId: number }) => {
  const user = await getUser(props.userId);
  const isAdmin = await userIsAdmin();
  if (!user || !isAdmin) {
    return null;
  }
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== user.organizationId) {
    return null;
  }
  return (
    <Link href={`${Routes.Users}/${props.userId}/edit`}>
      <Button>Edit</Button>
    </Link>
  );
};
